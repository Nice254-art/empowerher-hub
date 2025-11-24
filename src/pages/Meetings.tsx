import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, User, ExternalLink, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Meetings() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .gte("meeting_date", new Date().toISOString())
      .order("meeting_date", { ascending: true });

    if (error) {
      toast.error("Failed to load meetings");
    } else {
      setMeetings(data || []);
    }
    setLoading(false);
  };

  const handleReminder = (title: string) => {
    toast.success(`Reminder set for "${title}"`);
  };

  const handleJoin = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      toast.info("Meeting link will be available soon");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-hero animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading meetings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Educational Meetings</h1>
          <p className="text-muted-foreground">
            Join bi-weekly sessions on wellness, empowerment, and personal growth
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-card shadow-soft border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Calendar className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Bi-Weekly Learning Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Join expert-led sessions every two weeks covering topics like wellness, 
                  fitness, mental health, women's rights, and professional development. 
                  All sessions are free and open to the community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No upcoming meetings scheduled. Check back soon for new sessions!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {meetings.map((meeting) => {
              const meetingDate = new Date(meeting.meeting_date);
              const isToday = meetingDate.toDateString() === new Date().toDateString();
              const isSoon = (meetingDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

              return (
                <Card
                  key={meeting.id}
                  className={`shadow-soft ${isSoon ? "border-primary shadow-glow" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{meeting.title}</CardTitle>
                      {isToday && (
                        <Badge className="bg-primary">Today!</Badge>
                      )}
                      {!isToday && isSoon && (
                        <Badge variant="secondary">Soon</Badge>
                      )}
                    </div>
                    <CardDescription>{meeting.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {meetingDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {meetingDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {meeting.speaker && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{meeting.speaker}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleJoin(meeting.meeting_link)}
                        className="flex-1 bg-gradient-hero"
                        disabled={!meeting.meeting_link}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                      <Button
                        onClick={() => handleReminder(meeting.title)}
                        variant="outline"
                        size="icon"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
