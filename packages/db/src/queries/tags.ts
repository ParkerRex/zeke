// Tags functionality temporarily disabled during migration to Zeke
// This file will be reimplemented with the new tagging system

import type { Database } from "@db/client";

export const createTag = async (db: Database, params: any) => {
  throw new Error("Tags functionality is being migrated");
};

export const updateTag = async (db: Database, params: any) => {
  throw new Error("Tags functionality is being migrated");
};

export const deleteTag = async (db: Database, params: any) => {
  throw new Error("Tags functionality is being migrated");
};

export const getTags = async (db: Database, params: any) => {
  return []; // Return empty array during migration
};

export const getTagById = async (db: Database, params: any) => {
  return undefined;
};

// Keep type exports for compatibility
export type GetTagsParams = {
  teamId: string;
};
