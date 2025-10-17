"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";

type Props = {
  data: RouterOutputs["inbox"]["getById"];
};

export function InboxActions({ data }: Props) {
  return null;
}
