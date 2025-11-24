import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, ThumbsUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Community() {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [filterTopic, setFilterTopic] = useState("all");

  useEffect(() => {
    fetchQuestions();
  }, [filterTopic]);

  useEffect(() => {
    if (selectedQuestion) {
      fetchAnswers(selectedQuestion.id);
    }
  }, [selectedQuestion]);

  const fetchQuestions = async () => {
    let query = supabase
      .from("anonymous_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterTopic !== "all") {
      query = query.eq("topic", filterTopic as any);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load questions");
    } else {
      setQuestions(data || []);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    const { data, error } = await supabase
      .from("answers")
      .select(`
        *,
        profiles(name)
      `)
      .eq("question_id", questionId)
      .order("upvotes", { ascending: false });

    if (error) {
      toast.error("Failed to load answers");
    } else {
      setAnswers(data || []);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("anonymous_questions").insert({
        question,
        topic: topic as any,
      });

      if (error) throw error;

      toast.success("Question posted anonymously!");
      setQuestion("");
      setTopic("");
      fetchQuestions();
    } catch (error: any) {
      toast.error("Failed to post question");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answer.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("answers").insert({
        question_id: questionId,
        answer_text: answer,
      });

      if (error) throw error;

      toast.success("Answer posted!");
      setAnswer("");
      fetchAnswers(questionId);
    } catch (error: any) {
      toast.error("Failed to post answer");
    }
  };

  const topicColors: Record<string, string> = {
    safety: "bg-primary",
    relationships: "bg-accent",
    mental_health: "bg-secondary",
    fitness: "bg-primary",
    legal_help: "bg-accent",
    other: "bg-muted",
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Community Q&A</h1>
          <p className="text-muted-foreground">
            Ask questions anonymously and support each other
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ask Question Form */}
          <Card className="lg:col-span-1 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Ask Anonymously
              </CardTitle>
              <CardDescription>Your identity remains private</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Select value={topic} onValueChange={setTopic} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="relationships">Relationships</SelectItem>
                      <SelectItem value="mental_health">Mental Health</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="legal_help">Legal Help</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-hero"
                  disabled={loading}
                >
                  {loading ? "Posting..." : "Post Question"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Community Questions</CardTitle>
                <Select value={filterTopic} onValueChange={setFilterTopic}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="relationships">Relationships</SelectItem>
                    <SelectItem value="mental_health">Mental Health</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="legal_help">Legal Help</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                questions.map((q) => (
                  <div key={q.id}>
                    <button
                      onClick={() =>
                        setSelectedQuestion(selectedQuestion?.id === q.id ? null : q)
                      }
                      className="w-full text-left p-4 rounded-lg border hover:shadow-soft transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          className={`${topicColors[q.topic]} text-white capitalize`}
                        >
                          {q.topic.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium mb-2">{q.question}</p>
                    </button>

                    {selectedQuestion?.id === q.id && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-4">
                        <div className="space-y-3">
                          {answers.map((ans) => (
                            <div key={ans.id} className="bg-card p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {ans.profiles?.name || "Anonymous"}
                                </span>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span className="text-xs">{ans.upvotes}</span>
                                </div>
                              </div>
                              <p className="text-sm">{ans.answer_text}</p>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={3}
                          />
                          <Button
                            onClick={() => handleAnswer(q.id)}
                            size="sm"
                            className="bg-gradient-accent"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Post Answer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
