import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, Heart, MessageCircle, Users, TrendingUp, Award } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-hero animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your wellness dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const quickActions = [
    { icon: Dumbbell, label: "Log Workout", path: "/workouts", color: "text-primary" },
    { icon: Heart, label: "Report Support Case", path: "/support", color: "text-accent" },
    { icon: MessageCircle, label: "Ask Community", path: "/community", color: "text-secondary" },
    { icon: Users, label: "Find Mentor", path: "/mentors", color: "text-primary" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl shadow-glow">
          <img
            src={heroImage}
            alt="Women empowerment"
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40 flex items-center">
            <div className="px-8 md:px-12 text-background">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome back, {profile?.name}!
              </h1>
              <p className="text-lg md:text-xl mb-6 opacity-90">
                Continue your journey to wellness and empowerment
              </p>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-background/10 hover:bg-background/20 backdrop-blur-sm border-background/30"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Fitness Level</CardTitle>
                <Award className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold capitalize">{profile?.fitness_level || "Beginner"}</p>
              <CardDescription className="mt-2">Keep pushing forward!</CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Minutes</CardTitle>
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile?.total_workout_minutes || 0}</p>
              <CardDescription className="mt-2">Minutes exercised</CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Community</CardTitle>
                <Users className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Active</p>
              <CardDescription className="mt-2">Join discussions</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    variant="outline"
                    className="h-auto flex-col gap-3 py-6 hover:shadow-soft transition-all"
                  >
                    <Icon className={`h-8 w-8 ${action.color}`} />
                    <span className="font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
