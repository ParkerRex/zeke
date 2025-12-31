#!/usr/bin/env bun
/**
 * Test script to manually trigger analyze-story task
 * This will test the full pipeline including generate-brief, extract-highlights, and score-relevance
 */

import { getBoss } from "../src/boss";

const STORY_ID = process.argv[2] || "86463e3e-43af-4546-8bac-04dce4596fc5";

console.log("Triggering analyze-story for:", STORY_ID);

try {
  const boss = await getBoss();
  const jobId = await boss.send("analyze-story", {
    storyId: STORY_ID,
    trigger: "manual_test",
  });

  console.log("Task triggered successfully!");
  console.log("Job ID:", jobId);

  await boss.stop();
} catch (error) {
  console.error("Failed to trigger task:", error);
  process.exit(1);
}
