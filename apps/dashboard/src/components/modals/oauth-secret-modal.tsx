"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useOAuthSecretModalStore } from "@/store/oauth-secret-modal";
import { Button } from "@zeke/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zeke/ui/dialog";
import { Label } from "@zeke/ui/label";
import { CopyInput } from "../copy-input";

export function OAuthSecretModal() {
  const { isOpen, clientSecret, applicationName, close } =
    useOAuthSecretModalStore();

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>OAuth Application Created</DialogTitle>
            <DialogDescription>
              Your OAuth application "{applicationName}" has been created
              successfully. For security reasons, the client secret will only be
              shown once. Please copy and store it in a secure location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">
                Client Secret
              </Label>
              <CopyInput value={clientSecret || ""} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={close} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
