"use client";

import { useModalParams } from "@/hooks/use-modal-params";
import { api } from "@/trpc/client";
import { Button } from "@zeke/ui/button";
import { Label } from "@zeke/ui/label";
import { ScrollArea } from "@zeke/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zeke/ui/select";
import { Sheet, SheetContent, SheetHeader } from "@zeke/ui/sheet";
import { Textarea } from "@zeke/ui/textarea";
import { useToast } from "@zeke/ui/use-toast";
import { Loader2, PlayCircle, Zap } from "lucide-react";
import { useState } from "react";

/**
 * Playbook Run Sheet - Execute research playbooks with context
 * Replaces tracker functionality with automated research workflows
 */
export function PlaybookRunSheet() {
  const { playbookRun, playbookId, closePlaybookRun } = useModalParams();
  const { toast } = useToast();
  const [selectedPlaybook, setSelectedPlaybook] = useState(playbookId || "");
  const [context, setContext] = useState("");
  const isOpen = Boolean(playbookRun);

  const runPlaybook = api.trigger.runPlaybook.useMutation({
    onSuccess: (run) => {
      toast({
        title: "Playbook started",
        description: run?.id
          ? `Trigger.dev acknowledged run ${run.id}.`
          : "Playbook execution has started.",
      });
      closePlaybookRun();
      setContext("");
    },
    onError: (error) => {
      toast({
        title: "Failed to run playbook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaybook) return;

    runPlaybook.mutate({
      playbookId: selectedPlaybook,
      context: context ? { notes: context } : undefined,
    });
  };

  // Mock playbooks - in production these would come from the database
  const playbooks = [
    {
      id: "pb-competitor-analysis",
      name: "Competitor Analysis",
      description: "Analyze competitor moves and market positioning",
      icon: "🎯",
    },
    {
      id: "pb-weekly-digest",
      name: "Weekly Digest",
      description: "Generate a comprehensive weekly summary",
      icon: "📊",
    },
    {
      id: "pb-trend-detection",
      name: "Trend Detection",
      description: "Identify emerging patterns and signals",
      icon: "📈",
    },
    {
      id: "pb-content-brief",
      name: "Content Brief",
      description: "Create detailed content briefs from research",
      icon: "📝",
    },
  ];

  const selectedPlaybookDetails = playbooks.find(
    (p) => p.id === selectedPlaybook,
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closePlaybookRun()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Run Playbook
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Execute automated research workflows
          </p>
        </SheetHeader>

        <ScrollArea className="h-full pb-28" hideScrollbar>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="playbook">Select Playbook</Label>
              <Select
                value={selectedPlaybook}
                onValueChange={setSelectedPlaybook}
              >
                <SelectTrigger id="playbook">
                  <SelectValue placeholder="Choose a playbook..." />
                </SelectTrigger>
                <SelectContent>
                  {playbooks.map((playbook) => (
                    <SelectItem key={playbook.id} value={playbook.id}>
                      <div className="flex items-center gap-2">
                        <span>{playbook.icon}</span>
                        <span>{playbook.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlaybookDetails && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlaybookDetails.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (optional)</Label>
              <Textarea
                id="context"
                placeholder="Add any specific focus areas or requirements..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Provide additional context to customize the playbook execution
              </p>
            </div>

            {selectedPlaybookDetails && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span>What happens next:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  <li>• Playbook will run in the background</li>
                  <li>• You'll receive notifications on progress</li>
                  <li>• Results will appear in your insights feed</li>
                  <li>• Estimated time: 2-5 minutes</li>
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closePlaybookRun}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={runPlaybook.isPending || !selectedPlaybook}
                className="flex-1"
              >
                {runPlaybook.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Run Playbook
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
