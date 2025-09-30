"use client";

import { useModalParams } from "@/hooks/use-modal-params";
import { api } from "@/trpc/client";
import { Button } from "@zeke/ui/button";
import { Dialog, DialogContent } from "@zeke/ui/dialog";
import { ScrollArea } from "@zeke/ui/scroll-area";
import { Textarea } from "@zeke/ui/textarea";
import { useToast } from "@zeke/ui/use-toast";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Assistant Modal - Quick access to the AI assistant
 * Provides a dialog for starting new conversations or continuing existing ones
 */
export function AssistantModal() {
  const { assistant, chatId, assistantPrompt, closeAssistant } =
    useModalParams();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState(assistantPrompt ?? "");
  const isOpen = Boolean(assistant);

  useEffect(() => {
    if (assistant) {
      setMessage(assistantPrompt ?? "");
    } else {
      setMessage("");
    }
  }, [assistant, assistantPrompt]);

  const createChat = api.chats.create.useMutation({
    onSuccess: (chat) => {
      // Navigate to the chat interface
      router.push(`/chat/${chat.id}`);
      closeAssistant();
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (chatId) {
      // Continue existing chat
      router.push(`/chat/${chatId}?message=${encodeURIComponent(message)}`);
      closeAssistant();
    } else {
      // Create new chat
      createChat.mutate({
        title: message.substring(0, 50),
        initialMessage: message,
      });
    }
  };

  const examplePrompts = [
    "What are the top trending insights this week?",
    "Summarize recent highlights about AI developments",
    "Find stories related to our product roadmap",
    "What playbooks are available for competitive analysis?",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAssistant()}>
      <DialogContent className="max-w-2xl h-[60vh]">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Research Assistant</h2>
          </div>

          <ScrollArea className="flex-1 pb-4">
            {!message && (
              <div className="space-y-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Ask me about insights, stories, or help with research tasks
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Try asking:
                  </p>
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setMessage(prompt)}
                      className="block w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Ask me anything about your research..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAssistant}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createChat.isPending || !message.trim()}
                >
                  {createChat.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {chatId ? "Continue Chat" : "Start Conversation"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
