// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { create } from "zustand";

interface OAuthSecretModalState {
  isOpen: boolean;
  clientSecret?: string;
  applicationName?: string;
  setSecret: (secret: string, applicationName: string) => void;
  close: () => void;
}

export const useOAuthSecretModalStore = create<OAuthSecretModalState>()(
  (set) => ({
    isOpen: false,
    clientSecret: undefined,
    applicationName: undefined,
    setSecret: (secret, applicationName) =>
      set({
        isOpen: true,
        clientSecret: secret,
        applicationName,
      }),
    close: () =>
      set({
        isOpen: false,
        clientSecret: undefined,
        applicationName: undefined,
      }),
  }),
);
