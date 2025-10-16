import { api } from "@/trpc/client";
import { Icons } from "@zeke/ui/icons";
import { Sparkles } from "lucide-react";

export function ChatEmpty() {
  const { data: user } = api.user.me.useQuery();
  const firstName = user?.fullName?.split(" ")?.[0] ?? "there";

  return (
    <div className="w-full flex flex-col items-center justify-center text-center">
      <div className="relative">
        <Icons.LogoSmall />
        <Sparkles className="absolute -bottom-1 -right-1 h-4 w-4 text-primary animate-pulse" />
      </div>
      <h2 className="font-semibold text-xl mt-6">
        Hi {firstName}, how can I help you today?
      </h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        I can help you discover insights, analyze stories, run playbooks, or
        answer questions about your research data.
      </p>
    </div>
  );
}
