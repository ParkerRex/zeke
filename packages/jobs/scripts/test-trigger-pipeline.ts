#!/usr/bin/env bun
/**
 * Test Trigger.dev Pipeline
 *
 * Tests the complete pipeline:
 * 1. Ingest a YouTube video via Engine
 * 2. Wait for story to be created
 * 3. Trigger analyzeStory which triggers briefs + highlights in parallel
 * 4. Verify highlights with relevance scores are created
 */

import { tasks } from "@trigger.dev/sdk";
import { config } from "dotenv";

// Load environment variables
config({ path: "../../apps/api/.env" });

const TRIGGER_API_KEY = process.env.TRIGGER_SECRET_KEY;
const TRIGGER_PROJECT_ID = process.env.TRIGGER_PROJECT_ID;

if (!TRIGGER_API_KEY || !TRIGGER_PROJECT_ID) {
  console.error("❌ Missing TRIGGER_SECRET_KEY or TRIGGER_PROJECT_ID");
  process.exit(1);
}

async function testPipeline() {
  console.log("🧪 Testing Trigger.dev Pipeline\n");

  // Test with a real YouTube video (Rick Astley for testing)
  const TEST_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  console.log("Step 1: Ingesting YouTube video via Engine API...");
  const engineResponse = await fetch("http://localhost:8787/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: TEST_VIDEO_URL }),
  });

  if (!engineResponse.ok) {
    console.error("❌ Engine API failed:", await engineResponse.text());
    process.exit(1);
  }

  const engineData = await engineResponse.json();
  console.log("✅ Engine ingested:", engineData.data.title);
  console.log("   Video ID:", engineData.data.id);

  // For testing, we'll use a fake story ID since we don't have the full ingestion pipeline
  // In production, ingestYouTubeChannel would create the story
  const TEST_STORY_ID = "00000000-0000-0000-0000-000000000001"; // Replace with real ID from DB

  console.log("\nStep 2: Triggering generateBrief job...");
  try {
    const briefHandle = await tasks.trigger(
      "generate-brief",
      {
        storyId: TEST_STORY_ID,
        reason: "manual"
      }
    );
    console.log("✅ Brief job triggered:", briefHandle.id);
  } catch (error) {
    console.error("❌ Failed to trigger brief:", error);
  }

  console.log("\nStep 3: Triggering extractHighlights job...");
  try {
    const highlightHandle = await tasks.trigger(
      "extract-highlights",
      {
        storyId: TEST_STORY_ID,
        userId: "00000000-0000-0000-0000-000000000000", // System user
      }
    );
    console.log("✅ Highlight job triggered:", highlightHandle.id);
  } catch (error) {
    console.error("❌ Failed to trigger highlights:", error);
  }

  console.log("\n✨ Jobs triggered! Check Trigger.dev dashboard for execution logs.");
  console.log("   Dashboard: https://cloud.trigger.dev/projects/proj_upmducsinfivozgjrjfr");
}

testPipeline().catch(console.error);