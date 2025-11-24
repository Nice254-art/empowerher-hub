import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, TrendingUp, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Workouts() {
  const [minutes, setMinutes] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchWorkouts(data.user.id);
        fetchLeaderboard();
      }
    });
  }, []);

  const fetchWorkouts = async (userId: string) => {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      toast.error("Failed to load workouts");
    } else {
      setWorkouts(data || []);
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, total_workout_minutes, fitness_level")
      .order("total_workout_minutes", { ascending: false })
      .limit(10);

    if (error) {
      toast.error("Failed to load leaderboard");
    } else {
      setLeaderboard(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        minutes: parseInt(minutes),
        workout_type: workoutType,
      });

      if (error) throw error;

      toast.success("Workout logged! Keep up the great work! 💪");
      setMinutes("");
      setWorkoutType("");
      fetchWorkouts(user.id);
      fetchLeaderboard();
    } catch (error: any) {
      toast.error("Failed to log workout");
    } finally {
      setLoading(false);
    }
  };

  const getFitnessColor = (level: string) => {
    switch (level) {
      case "advanced":
        return "bg-primary text-primary-foreground";
      case "intermediate":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Workout Tracker</h1>
          <p className="text-muted-foreground">Log your workouts and track your progress</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Log Workout Form */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Log Today's Workout
              </CardTitle>
              <CardDescription>Track your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minutes">Duration (minutes)</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="1"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Workout Type</Label>
                  <Select value={workoutType} onValueChange={setWorkoutType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workout type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="dance">Dance</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-hero"
                  disabled={loading}
                >
                  {loading ? "Logging..." : "Log Workout"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Recent Workouts
              </CardTitle>
              <CardDescription>Your latest sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {workouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No workouts logged yet. Start your journey!
                </p>
              ) : (
                <div className="space-y-3">
                  {workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium capitalize">{workout.workout_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{workout.minutes} min</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Community Leaderboard
            </CardTitle>
            <CardDescription>Top performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((profile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-card"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-hero text-background font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.total_workout_minutes} minutes
                    </p>
                  </div>
                  <Badge className={getFitnessColor(profile.fitness_level)}>
                    {profile.fitness_level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
