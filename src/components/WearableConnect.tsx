import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

export function WearableConnect() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const connectWearable = async (provider: "google_fit" | "fitbit") => {
    setConnecting(provider);
    try {
      const functionName = provider === "google_fit" ? "google-fit-oauth" : "fitbit-oauth";
      
      const { data, error } = await supabase.functions.invoke(functionName);

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank", "width=600,height=700");
        toast.success("Please complete authentication in the popup window");
      }
    } catch (error: any) {
      toast.error(`Failed to connect ${provider}: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };

  const syncData = async (provider: "google_fit" | "fitbit") => {
    setConnecting(provider);
    try {
      const functionName = provider === "google_fit" ? "google-fit-oauth" : "fitbit-oauth";
      
      const { data, error } = await supabase.functions.invoke(
        functionName,
        { body: { action: "sync" } }
      );

      if (error) throw error;

      toast.success(`Synced ${data.records} records from ${provider}`);
      
      // Trigger score calculation
      await supabase.functions.invoke("calculate-weekly-scores");
    } catch (error: any) {
      toast.error(`Failed to sync ${provider}: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Connect Wearable Devices
        </CardTitle>
        <CardDescription>
          Sync your fitness data automatically from your favorite devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Google Fit</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => connectWearable("google_fit")}
                disabled={connecting !== null}
                className="flex-1"
                variant="outline"
              >
                {connecting === "google_fit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
              <Button
                onClick={() => syncData("google_fit")}
                disabled={connecting !== null}
                className="flex-1"
              >
                Sync Now
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Fitbit</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => connectWearable("fitbit")}
                disabled={connecting !== null}
                className="flex-1"
                variant="outline"
              >
                {connecting === "fitbit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
              <Button
                onClick={() => syncData("fitbit")}
                disabled={connecting !== null}
                className="flex-1"
              >
                Sync Now
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="text-muted-foreground">
            <strong>Note:</strong> Apple Health integration requires a native iOS app. 
            For now, you can manually log workouts or use Google Fit/Fitbit.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}