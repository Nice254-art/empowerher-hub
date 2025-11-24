import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Search, ExternalLink, FileText, Video, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Resources() {
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory, resources]);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load resources");
    } else {
      setResources(data || []);
    }
    setLoading(false);
  };

  const filterResources = () => {
    let filtered = resources;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  };

  const categories = ["all", "wellness", "fitness", "emotional_support", "safety", "womens_rights"];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "article":
        return <File className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-hero animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Resource Library</h1>
          <p className="text-muted-foreground">
            Explore articles, videos, and guides on wellness and empowerment
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                  >
                    {cat.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "No resources match your search"
                  : "No resources available yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="shadow-soft hover:shadow-glow transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-gradient-hero text-background">
                      {getResourceIcon(resource.resource_type)}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {resource.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(resource.content_url, "_blank")}
                    className="w-full bg-gradient-accent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Resource
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
