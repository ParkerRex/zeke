"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { ReactNode } from "react";
import { InboxHeader } from "./inbox-header";
import { UploadZone } from "./inbox-upload-zone";

type Props = {
  children: ReactNode;
};

export function Inbox({ children }: Props) {
  return (
    <UploadZone>
      <InboxHeader />
      {children}
    </UploadZone>
  );
}
