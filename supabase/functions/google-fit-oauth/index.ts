import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // OAuth callback
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      if (!code) {
        throw new Error('No authorization code provided')
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('GOOGLE_FIT_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_FIT_CLIENT_SECRET') ?? '',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-fit-oauth?action=callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()

      // Store connection
      await supabaseClient.from('wearable_connections').upsert({
        user_id: user.id,
        provider: 'google_fit',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
    }

    // Sync data
    if (action === 'sync') {
      const { data: connection } = await supabaseClient
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_fit')
        .single()

      if (!connection) {
        throw new Error('Google Fit not connected')
      }

      // Fetch last 7 days of data
      const endTime = Date.now()
      const startTime = endTime - (7 * 24 * 60 * 60 * 1000)

      const fitnessData = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [
              { dataTypeName: 'com.google.step_count.delta' },
              { dataTypeName: 'com.google.active_minutes' },
              { dataTypeName: 'com.google.calories.expended' },
            ],
            bucketByTime: { durationMillis: 86400000 }, // 1 day
            startTimeMillis: startTime,
            endTimeMillis: endTime,
          }),
        }
      )

      const data = await fitnessData.json()

      // Process and store data
      const wearableData = []
      for (const bucket of data.bucket || []) {
        const date = new Date(parseInt(bucket.startTimeMillis))
        const steps = bucket.dataset[0]?.point[0]?.value[0]?.intVal || 0
        const activeMinutes = bucket.dataset[1]?.point[0]?.value[0]?.intVal || 0
        const calories = bucket.dataset[2]?.point[0]?.value[0]?.fpVal || 0

        wearableData.push({
          user_id: user.id,
          date: date.toISOString().split('T')[0],
          steps,
          active_minutes: activeMinutes,
          calories: Math.round(calories),
          source: 'google_fit',
        })
      }

      if (wearableData.length > 0) {
        await supabaseClient.from('wearable_data').upsert(wearableData)
      }

      return new Response(JSON.stringify({ success: true, records: wearableData.length }), { headers: corsHeaders })
    }

    // Get OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', Deno.env.get('GOOGLE_FIT_CLIENT_ID') ?? '')
    authUrl.searchParams.set('redirect_uri', `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-fit-oauth?action=callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('state', user.id)

    return new Response(JSON.stringify({ url: authUrl.toString() }), { headers: corsHeaders })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})