"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { AnimatePresence } from "framer-motion";
import { MatchTransaction } from "./match-transaction";
import { SuggestedMatch } from "./suggested-match";

import type { RouterOutputs } from "@api/trpc/routers/_app";

type Props = {
  data: RouterOutputs["inbox"]["getById"];
};

export function InboxActions({ data }: Props) {
  return (
    <AnimatePresence>
      {data?.status === "suggested_match" && !data?.transactionId && (
        <SuggestedMatch key="suggested-match" />
      )}

      {!data?.suggestion && <MatchTransaction key="match-transaction" />}
    </AnimatePresence>
  );
}
