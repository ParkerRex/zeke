#!/usr/bin/env bun
/**
 * Test script to trigger a one-off ingestion
 * Usage: bun run scripts/test-ingest.ts <url>
 */

import { tasks } from "@trigger.dev/sdk/v3";

const url = process.argv[2];

if (!url) {
  console.error("Usage: bun run scripts/test-ingest.ts <url>");
  process.exit(1);
}

console.log(`🚀 Triggering ingestion for: ${url}`);

try {
  const handle = await tasks.trigger("ingest-oneoff", {
    url,
    requestedBy: undefined, // Optional: system-triggered
  });

  console.log(`✅ Task triggered successfully!`);
  console.log(`   Task ID: ${handle.id}`);
  console.log(`\n📊 View logs at: https://cloud.trigger.dev`);
  console.log(`   Or check your local Trigger.dev dev server`);
} catch (error) {
  console.error("❌ Failed to trigger task:", error);
  process.exit(1);
}