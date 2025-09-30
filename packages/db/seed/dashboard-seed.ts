#!/usr/bin/env bun

/**
 * Research Dashboard Seed Script
 * Populates the database with mock data for testing the research-focused dashboard
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/schema";
import { nanoid } from "nanoid";

// Connection string from environment or default to local
const connectionString =
  process.env.DATABASE_SESSION_POOLER_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const sql = postgres(connectionString);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding research dashboard data...");

  try {
    // ============================================================================
    // 1. TEAMS AND USERS
    // ============================================================================

    const teamId1 = "11111111-1111-1111-1111-111111111111";
    const teamId2 = "22222222-2222-2222-2222-222222222222";
    const userId1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const userId2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const userId3 = "cccccccc-cccc-cccc-cccc-cccccccccccc";

    // Insert teams
    await db
      .insert(schema.teams)
      .values([
        {
          id: teamId1,
          name: "Acme Research",
          slug: "acme-research",
          planCode: "trial",
        },
        {
          id: teamId2,
          name: "Beta Labs",
          slug: "beta-labs",
          planCode: "pro",
        },
      ])
      .onConflictDoNothing();

    // Insert users (without team_id since that column doesn't exist)
    await db
      .insert(schema.users)
      .values([
        {
          id: userId1,
          email: "alice@example.com",
          fullName: "Alice Researcher",
          locale: "en",
          timezone: "America/New_York",
        },
        {
          id: userId2,
          email: "bob@example.com",
          fullName: "Bob Analyst",
          locale: "en",
          timezone: "Europe/London",
        },
        {
          id: userId3,
          email: "charlie@example.com",
          fullName: "Charlie Manager",
          locale: "en",
          timezone: "Asia/Tokyo",
        },
      ])
      .onConflictDoNothing();

    // Create team memberships
    await db
      .insert(schema.teamMembers)
      .values([
        { teamId: teamId1, userId: userId1, role: "owner" },
        { teamId: teamId1, userId: userId2, role: "member" },
        { teamId: teamId2, userId: userId3, role: "owner" },
      ])
      .onConflictDoNothing();

    console.log("✅ Teams and users created");

    // ============================================================================
    // 2. CHAT DATA (New Assistant)
    // ============================================================================

    const chatId1 = nanoid(12);
    const chatId2 = nanoid(12);
    const chatId3 = nanoid(12);

    // Create sample chats
    await db
      .insert(schema.chats)
      .values([
        {
          id: chatId1,
          teamId: teamId1,
          userId: userId1,
          title: "GPT-5 implications for our product",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: chatId2,
          teamId: teamId1,
          userId: userId1,
          title: "Cost analysis for LLM deployment",
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
          updatedAt: new Date(Date.now() - 259200000),
        },
        {
          id: chatId3,
          teamId: teamId1,
          userId: userId2,
          title: "Transformer architecture questions",
          createdAt: new Date(Date.now() - 432000000), // 5 days ago
          updatedAt: new Date(Date.now() - 432000000),
        },
      ])
      .onConflictDoNothing();

    // Create sample chat messages
    await db
      .insert(schema.chatMessages)
      .values([
        {
          chatId: chatId1,
          teamId: teamId1,
          userId: userId1,
          content: {
            role: "user",
            content:
              "What are the key implications of GPT-5's efficiency improvements for our product roadmap?",
            id: nanoid(),
          },
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          chatId: chatId1,
          teamId: teamId1,
          userId: userId1,
          content: {
            role: "assistant",
            content:
              "Based on the recent GPT-5 architecture revelations, here are the key implications:\\n\\n1. **Reduced Infrastructure Costs**: The 40% efficiency gain means you could run similar capabilities with significantly less compute.\\n\\n2. **Faster Response Times**: Improved efficiency translates to lower latency for end users.\\n\\n3. **Competitive Advantage**: Early adoption could differentiate your product while competitors are still using older, less efficient models.",
            id: nanoid(),
          },
          createdAt: new Date(Date.now() - 86340000),
        },
        {
          chatId: chatId2,
          teamId: teamId1,
          userId: userId1,
          content: {
            role: "user",
            content:
              "Break down the hidden costs mentioned in the LLM training article",
            id: nanoid(),
          },
          createdAt: new Date(Date.now() - 259200000),
        },
        {
          chatId: chatId2,
          teamId: teamId1,
          userId: userId1,
          content: {
            role: "assistant",
            content:
              "The article identifies several hidden costs beyond compute:\\n\\n**Data Curation (30% of budget)**\\n- Cleaning and preprocessing\\n- Quality validation\\n- License fees for proprietary datasets\\n\\n**Human Feedback (25% of budget)**\\n- RLHF annotation teams\\n- Subject matter expert reviews\\n- Quality assurance processes\\n\\n**Infrastructure (20% of budget)**\\n- Data storage and transfer\\n- Monitoring and logging\\n- Backup and disaster recovery",
            id: nanoid(),
          },
          createdAt: new Date(Date.now() - 259140000),
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Chat data created");

    // ============================================================================
    // 3. SAMPLE FEEDBACK
    // ============================================================================

    await db
      .insert(schema.chatFeedback)
      .values([
        {
          chatId: chatId1,
          messageId: "msg2",
          teamId: teamId1,
          userId: userId1,
          type: "positive",
          comment: "Very helpful analysis of GPT-5 implications",
          createdAt: new Date(Date.now() - 85000000),
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Chat feedback created");

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log(`
🎉 Research dashboard seed data loaded successfully!
   - Teams: 2
   - Users: 3
   - Chats: 3
   - Messages: 4
   - Feedback: 1
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error("Fatal error during seeding:", error);
  process.exit(1);
});
