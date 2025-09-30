#!/usr/bin/env bun
import { db } from "@zeke/db/client";
import { stories } from "@zeke/db/schema";
import { config } from "dotenv";
import { desc } from "drizzle-orm";

config({ path: "../../apps/api/.env" });

async function getStoryId() {
  try {
    const [story] = await db
      .select({ id: stories.id, title: stories.title })
      .from(stories)
      .orderBy(desc(stories.created_at))
      .limit(1);

    if (story) {
      console.log("✅ Found story:");
      console.log("   ID:", story.id);
      console.log("   Title:", story.title);
      console.log("\n📋 Copy this ID to test with:");
      console.log(story.id);
      return story.id;
    }
    console.log("❌ No stories found in database.");
    console.log("💡 Create one by ingesting content first.");
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

getStoryId();
