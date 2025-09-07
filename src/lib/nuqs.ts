// Centralized nuqs parsers for URL state
// See agents.md for usage patterns.
"use client";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";

export const qParser = parseAsString.withDefault("");

export const kindParser = parseAsStringEnum([
  "all",
  "youtube",
  "arxiv",
  "podcast",
  "reddit",
  "hn",
  "article",
] as const).withDefault("all");

export const panelParser = parseAsBoolean.withDefault(true);

// Optional: encode a list of tab IDs and the active one
export const tabsParser = parseAsArrayOf(parseAsString).withDefault([]);

export const activeParser = parseAsString.withDefault("");

export const companyViewParser = parseAsStringEnum([
  "news",
  "ceo",
] as const).withDefault("news");
