#!/usr/bin/env bun
/**
 * Seed ICP Sources
 *
 * Populates the database with hardcoded Ideal Customer Profile sources
 * Run with: bun run packages/jobs/scripts/seed-icp-sources.ts
 */

import { config } from "dotenv";
import { ICP_SOURCES } from "../src/config/icp-sources";
import { createSourceQueries } from "@zeke/db/queries";
import { db } from "@zeke/db/client";

// Load environment variables
config({ path: "../../apps/api/.env.local" });

async function seedICPSources() {
  console.log("🌱 Seeding ICP sources...\n");

  const sourcesQueries = createSourceQueries(db);

  let created = 0;
  let skipped = 0;

  for (const icpSource of ICP_SOURCES) {
    try {
      console.log(`  📡 Processing: ${icpSource.name} (${icpSource.type})`);

      // Check if source already exists by URL
      const existing = await db
        .select()
        .from(sources)
        .where(eq(sources.url, icpSource.url))
        .limit(1);

      if (existing.length > 0) {
        console.log(`     ⏭️  Already exists: ${existing[0].id}`);
        skipped++;
        continue;
      }

      // Create the source directly
      const [newSource] = await db
        .insert(sources)
        .values({
          type: icpSource.type,
          url: icpSource.url,
          name: icpSource.name,
          authority_score: icpSource.authority_score.toString(),
          is_active: true,
          metadata: {
            keywords: icpSource.keywords,
            check_frequency_hours: icpSource.check_frequency_hours,
            is_icp_source: true,
            added_by: "seed-script",
          },
        })
        .returning({ id: sources.id });

      if (newSource) {
        console.log(`     ✅ Created: ${newSource.id}`);
        created++;
      }
    } catch (error) {
      console.error(`     ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total ICP sources: ${ICP_SOURCES.length}`);

  process.exit(0);
}

// Import sources table for direct update
import { sources } from "@zeke/db/schema";
import { eq } from "drizzle-orm";

seedICPSources().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});