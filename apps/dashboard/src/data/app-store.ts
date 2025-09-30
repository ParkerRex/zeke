import type { ComponentType } from "react";

export type AppStoreApp = {
  id: string;
  name: string;
  active: boolean;
  logo?: ComponentType | string | null;
  short_description: string;
  description?: string | null;
  images?: string[] | null;
  category?: string;
  settings?: Array<Record<string, unknown>>;
  onInitialize?: () => void | Promise<void>;
};

export type UnifiedApp = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  logo?: ComponentType | string | null;
  short_description?: string | null;
  description?: string | null;
  images?: string[];
  installed: boolean;
  type: "official" | "external";
  onInitialize?: () => Promise<void>;
  settings?: Array<Record<string, unknown>>;
  userSettings?: Record<string, unknown>;
  clientId?: string;
  scopes?: string[];
  developerName?: string;
  website?: string;
  installUrl?: string;
  screenshots?: string[];
  overview?: string;
  createdAt?: string;
  status?: string;
  lastUsedAt?: string;
};

/**
 * Temporary placeholder for in-app marketplace entries. Replace with real configuration
 * once the app store package lands in the monorepo.
 */
export const apps: AppStoreApp[] = [];
