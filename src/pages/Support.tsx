import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Support() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchReports(data.user.id);
      }
    });
  }, []);

  const fetchReports = async (userId: string) => {
    const { data, error } = await supabase
      .from("abuse_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reports");
    } else {
      setReports(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("abuse_reports").insert({
        user_id: user.id,
        description,
        location,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Report submitted. Your safety matters. We're here to help.");
      setDescription("");
      setLocation("");
      fetchReports(user.id);
    } catch (error: any) {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "reviewed":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            Safety & Support
          </h1>
          <p className="text-muted-foreground">
            Your safety is our priority. Report any abuse or harassment confidentially.
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-primary shadow-soft">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Your Privacy is Protected</h3>
                <p className="text-sm text-muted-foreground">
                  All reports are confidential and handled with care by our support team. 
                  If you're in immediate danger, please contact local emergency services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Report Form */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Submit a Report</CardTitle>
              <CardDescription>
                Share what happened. Every detail helps us support you better.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">What happened?</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe the incident..."
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where did this occur?"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-hero"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your report will be reviewed by our team within 24 hours
                </p>
              </form>
            </CardContent>
          </Card>

          {/* My Reports */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>My Reports</CardTitle>
              <CardDescription>Track the status of your submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reports submitted yet
                </p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <Badge variant="secondary" className="capitalize">
                            {report.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                      {report.location && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Location: {report.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resources Card */}
        <Card className="shadow-soft bg-secondary/20">
          <CardHeader>
            <CardTitle>Need Immediate Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">National Domestic Violence Hotline</h4>
              <p className="text-sm text-muted-foreground">1-800-799-7233 (24/7)</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">RAINN Sexual Assault Hotline</h4>
              <p className="text-sm text-muted-foreground">1-800-656-4673 (24/7)</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Crisis Text Line</h4>
              <p className="text-sm text-muted-foreground">Text HOME to 741741</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
