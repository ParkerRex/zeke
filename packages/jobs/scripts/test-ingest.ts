#!/usr/bin/env bun
/**
 * Test script to trigger a one-off ingestion
 * Usage: bun run scripts/test-ingest.ts <url>
 */

import { getBoss } from "../src/boss";

const url = process.argv[2];

if (!url) {
  console.error("Usage: bun run scripts/test-ingest.ts <url>");
  process.exit(1);
}

console.log(`Triggering ingestion for: ${url}`);

try {
  const boss = await getBoss();
  const jobId = await boss.send("ingest-oneoff", {
    url,
    requestedBy: undefined, // Optional: system-triggered
  });

  console.log(`Task triggered successfully!`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`\nMonitor job status in the database or via API`);

  await boss.stop();
} catch (error) {
  console.error("Failed to trigger task:", error);
  process.exit(1);
}
