import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Mail, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Mentors() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from("mentors")
      .select(`
        *,
        profiles(name, profile_picture_url)
      `)
      .eq("approved", true);

    if (error) {
      toast.error("Failed to load mentors");
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  const handleRequestMentor = (mentorName: string) => {
    toast.success(`Request sent to ${mentorName}! They'll reach out soon.`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-hero animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading mentors...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Find a Mentor</h1>
          <p className="text-muted-foreground">
            Connect with experienced women who can guide your journey
          </p>
        </div>

        {/* Hero Card */}
        <Card className="bg-gradient-card shadow-glow border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Users className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Why Find a Mentor?</h3>
                <p className="text-sm text-muted-foreground">
                  Our mentors are vetted professionals ready to support your personal growth, 
                  career development, and emotional wellness. Get guidance from women who've 
                  walked similar paths and can help light your way forward.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        {mentors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No mentors available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="shadow-soft hover:shadow-glow transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-hero text-background text-xl">
                        {mentor.profiles?.name?.charAt(0) || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">
                        {mentor.profiles?.name || "Mentor"}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Award className="h-3 w-3" />
                        <span>Verified Mentor</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {mentor.bio}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.skills?.slice(0, 3).map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {mentor.skills?.length > 3 && (
                        <Badge variant="outline">+{mentor.skills.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                  {mentor.availability && (
                    <div>
                      <p className="text-sm font-medium mb-1">Availability</p>
                      <p className="text-sm text-muted-foreground">
                        {mentor.availability}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => handleRequestMentor(mentor.profiles?.name || "mentor")}
                    className="w-full bg-gradient-accent"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Request Mentorship
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
