"use client";

import { useModalParams } from "@/hooks/use-modal-params";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import { Label } from "@zeke/ui/label";
import { ScrollArea } from "@zeke/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@zeke/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zeke/ui/tabs";
import { useToast } from "@zeke/ui/use-toast";
import {
  ArrowUpRight,
  Copy,
  Link2,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

/**
 * Insight Link Sheet - Link insights to stories, goals, or other insights
 * Enables building connections between research artifacts
 */
export function InsightLinkSheet() {
  const { insightLink, insightId, highlightId, closeInsightLink } =
    useModalParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("stories");
  const isOpen = Boolean(insightLink);

  // Mock data - in production these would come from API
  const mockStories = [
    {
      id: "story-1",
      title: "AI Infrastructure Evolution",
      date: "2024-01-20",
      relevance: 0.92,
    },
    {
      id: "story-2",
      title: "Developer Tool Adoption Trends",
      date: "2024-01-19",
      relevance: 0.87,
    },
    {
      id: "story-3",
      title: "Cloud Cost Optimization Strategies",
      date: "2024-01-18",
      relevance: 0.75,
    },
  ];

  const mockInsights = [
    {
      id: "insight-1",
      title: "Infrastructure costs reducing with new tools",
      type: "insight",
      confidence: 0.88,
    },
    {
      id: "insight-2",
      title: "Developer productivity metrics improving",
      type: "quote",
      confidence: 0.92,
    },
    {
      id: "insight-3",
      title: "Action: Evaluate new deployment strategies",
      type: "action",
      confidence: 0.79,
    },
  ];

  const mockGoals = [
    {
      id: "goal-1",
      name: "Reduce Infrastructure Costs",
      progress: 65,
    },
    {
      id: "goal-2",
      name: "Improve Developer Experience",
      progress: 45,
    },
    {
      id: "goal-3",
      name: "Optimize CI/CD Pipeline",
      progress: 80,
    },
  ];

  const handleLink = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to link",
        variant: "destructive",
      });
      return;
    }

    // In production, this would call an API endpoint
    toast({
      title: "Links created",
      description: `Successfully linked ${selectedItems.length} item${
        selectedItems.length > 1 ? "s" : ""
      }`,
    });
    closeInsightLink();
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/insight/${
      insightId || highlightId
    }`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeInsightLink()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link Insight
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect this insight to related content
          </p>
        </SheetHeader>

        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Share Link
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="stories">
            <ScrollArea className="h-[350px]" hideScrollbar>
              <div className="space-y-2">
                {mockStories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => toggleSelection(story.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedItems.includes(story.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{story.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {story.date} • Relevance:{" "}
                          {Math.round(story.relevance * 100)}%
                        </p>
                      </div>
                      {story.relevance > 0.85 && (
                        <TrendingUp className="h-4 w-4 text-green-600 ml-2 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights">
            <ScrollArea className="h-[350px]" hideScrollbar>
              <div className="space-y-2">
                {mockInsights.map((insight) => (
                  <button
                    key={insight.id}
                    type="button"
                    onClick={() => toggleSelection(insight.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedItems.includes(insight.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.type} • Confidence:{" "}
                          {Math.round(insight.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="goals">
            <ScrollArea className="h-[350px]" hideScrollbar>
              <div className="space-y-2">
                {mockGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleSelection(goal.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedItems.includes(goal.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{goal.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={closeInsightLink}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedItems.length === 0}
            className="flex-1"
          >
            Link {selectedItems.length > 0 && `(${selectedItems.length})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
