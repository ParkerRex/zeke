// Centralized nuqs parsers for URL state
// See agents.md for usage patterns.
'use client';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  parseAsJson,
} from 'nuqs';

export const qParser = parseAsString.withDefault('');

export const kindParser = parseAsStringEnum([
  'all',
  'youtube',
  'arxiv',
  'podcast',
  'reddit',
  'hn',
  'article',
] as const).withDefault('all');

export const panelParser = parseAsBoolean.withDefault(true);

// Left navigation (rail) expanded/collapsed state
// false = collapsed (icons only), true = expanded (wide sidebar)
export const navParser = parseAsBoolean.withDefault(false);

// Enhanced tab management parsers
export const tabsParser = parseAsArrayOf(parseAsString).withDefault([]);

export const activeTabParser = parseAsString.withDefault('');

// Panel state - JSON for per-tab panel states
export const panelStatesParser = parseAsJson<Record<string, boolean>>().withDefault({});

// Global panel state fallback (renamed from panelParser for clarity)
export const globalPanelParser = parseAsBoolean.withDefault(true);

// Tab metadata (for complex tab data)
export const tabMetadataParser = parseAsJson<Record<string, {
  title?: string;
  pinned?: boolean;
  preview?: boolean;
  clusterId?: string;
  embedKind?: string;
  embedUrl?: string;
}>>().withDefault({});

// Keep legacy activeParser for backward compatibility
export const activeParser = activeTabParser;

export const companyViewParser = parseAsStringEnum([
  'news',
  'ceo',
] as const).withDefault('news');
