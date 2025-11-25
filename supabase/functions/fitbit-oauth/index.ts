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

      const clientId = Deno.env.get('FITBIT_CLIENT_ID') ?? ''
      const clientSecret = Deno.env.get('FITBIT_CLIENT_SECRET') ?? ''
      const credentials = btoa(`${clientId}:${clientSecret}`)

      const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/fitbit-oauth?action=callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()

      await supabaseClient.from('wearable_connections').upsert({
        user_id: user.id,
        provider: 'fitbit',
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
        .eq('provider', 'fitbit')
        .single()

      if (!connection) {
        throw new Error('Fitbit not connected')
      }

      const wearableData = []
      
      // Fetch last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const response = await fetch(
          `https://api.fitbit.com/1/user/-/activities/date/${dateStr}.json`,
          {
            headers: { 'Authorization': `Bearer ${connection.access_token}` },
          }
        )

        const data = await response.json()

        wearableData.push({
          user_id: user.id,
          date: dateStr,
          steps: data.summary?.steps || 0,
          active_minutes: data.summary?.veryActiveMinutes + data.summary?.fairlyActiveMinutes || 0,
          calories: data.summary?.caloriesOut || 0,
          source: 'fitbit',
        })
      }

      if (wearableData.length > 0) {
        await supabaseClient.from('wearable_data').upsert(wearableData)
      }

      return new Response(JSON.stringify({ success: true, records: wearableData.length }), { headers: corsHeaders })
    }

    // Get OAuth URL
    const authUrl = new URL('https://www.fitbit.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', Deno.env.get('FITBIT_CLIENT_ID') ?? '')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', `${Deno.env.get('SUPABASE_URL')}/functions/v1/fitbit-oauth?action=callback`)
    authUrl.searchParams.set('scope', 'activity heartrate nutrition profile sleep')
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