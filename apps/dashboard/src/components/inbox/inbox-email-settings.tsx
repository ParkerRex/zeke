"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { CopyInput } from "@/components/copy-input";
import { useUserQuery } from "@/hooks/use-user";
import { getInboxEmail } from "@zeke/inbox";
import { Card, CardDescription, CardHeader, CardTitle } from "@zeke/ui/card";

export function InboxEmailSettings() {
  const { data: user } = useUserQuery();
  const inboxEmail = getInboxEmail(user?.team?.inboxId ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>
          Use this unique email address for online purchases and receipts.
          Emails sent to this address will automatically appear in your inbox
          and can be matched against transactions.
        </CardDescription>
      </CardHeader>

      <div className="px-6 pb-6 max-w-[400px]">
        <CopyInput value={inboxEmail} />
      </div>
    </Card>
  );
}
