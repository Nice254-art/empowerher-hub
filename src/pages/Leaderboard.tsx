import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, TrendingUp, Flame, Crown } from "lucide-react";

type FitnessLevel = "beginner" | "intermediate" | "advanced" | "elite";

interface LeaderboardUser {
  id: string;
  name: string;
  weekly_score: number;
  fitness_level: FitnessLevel;
  category_rank: number;
  total_workout_minutes: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FitnessLevel>("beginner");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, weekly_score, fitness_level, category_rank, total_workout_minutes")
        .order("category_rank", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load leaderboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: FitnessLevel) => {
    switch (level) {
      case "elite":
        return <Crown className="h-5 w-5 text-primary" />;
      case "advanced":
        return <Flame className="h-5 w-5 text-accent" />;
      case "intermediate":
        return <TrendingUp className="h-5 w-5 text-secondary" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: FitnessLevel) => {
    switch (level) {
      case "elite":
        return "bg-primary text-primary-foreground";
      case "advanced":
        return "bg-accent text-accent-foreground";
      case "intermediate":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const filteredUsers = users.filter((u) => u.fitness_level === activeTab);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you rank in your fitness category
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FitnessLevel)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="elite">Elite</TabsTrigger>
          </TabsList>

          {(["beginner", "intermediate", "advanced", "elite"] as FitnessLevel[]).map((level) => (
            <TabsContent key={level} value={level}>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getLevelIcon(level)}
                    {level.charAt(0).toUpperCase() + level.slice(1)} Rankings
                  </CardTitle>
                  <CardDescription>
                    Top performers in the {level} category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero animate-pulse mx-auto" />
                      <p className="text-muted-foreground mt-4">Loading rankings...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No users in this category yet. Be the first!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                            user.category_rank <= 3
                              ? "bg-gradient-card shadow-soft"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-hero text-background font-bold text-lg">
                            {getRankBadge(user.category_rank || 0)}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{user.total_workout_minutes || 0} total minutes</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge className={getLevelColor(user.fitness_level)}>
                              Score: {(user.weekly_score || 0).toFixed(2)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {((user.weekly_score || 0) * 100).toFixed(0)}% weekly
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}