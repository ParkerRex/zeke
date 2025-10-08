"use client";

import { useModalParams } from "@/hooks/use-modal-params";
import { api } from "@/trpc/client";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
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
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Source Intake Sheet - Allows users to ingest URLs or upload content
 * Replaces finance import functionality with research content ingestion
 */
export function SourceIntakeSheet() {
  const { sourceIntake, sourceUrl, closeSourceIntake } = useModalParams();
  const { toast } = useToast();
  const [url, setUrl] = useState(sourceUrl || "");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [notes, setNotes] = useState("");
  const isOpen = Boolean(sourceIntake);

  const ingestUrl = api.trigger.ingestUrl.useMutation({
    onSuccess: (run) => {
      toast({
        title: "Source queued",
        description: run?.id
          ? `Run ${run.id} acknowledged by Trigger.dev.`
          : "The URL has been added to the ingestion queue.",
      });
      closeSourceIntake();
      setUrl("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Ingestion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    ingestUrl.mutate({
      url,
      priority,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSourceIntake()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-8">
          <h2 className="text-xl font-semibold">Add Source</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add a URL to the ingestion pipeline for analysis
          </p>
        </SheetHeader>

        <ScrollArea className="h-full pb-28" hideScrollbar>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of the content you want to analyze
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as "normal" | "high")
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                High priority sources are processed first
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any context or notes about this source..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeSourceIntake}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={ingestUrl.isPending || !url}
                className="flex-1"
              >
                {ingestUrl.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add to Pipeline
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
