#!/usr/bin/env bun
/**
 * Test script to manually trigger analyze-story task
 * This will test the full pipeline including generate-brief, extract-highlights, and score-relevance
 */

import { tasks } from "@trigger.dev/sdk";

const STORY_ID = "86463e3e-43af-4546-8bac-04dce4596fc5";

console.log("🚀 Triggering analyze-story for:", STORY_ID);

try {
  const result = await tasks.trigger("analyze-story", {
    storyId: STORY_ID,
    trigger: "manual_test",
  });

  console.log("✅ Task triggered successfully!");
  console.log("Run ID:", result);
} catch (error) {
  console.error("❌ Failed to trigger task:", error);
  process.exit(1);
}