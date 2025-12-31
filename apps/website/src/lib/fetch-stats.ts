"use server";

import { connectDb } from "@zeke/db/client";
import { sql } from "drizzle-orm";

export async function fetchStats() {
  const db = await connectDb();

  // Query only existing tables using Drizzle
  const [
    teamsResult,
    storiesResult,
    highlightsResult,
    sourcesResult,
    customersResult,
  ] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as count FROM teams`),
    db.execute(sql`SELECT COUNT(*) as count FROM stories`),
    db.execute(sql`SELECT COUNT(*) as count FROM highlights`),
    db.execute(sql`SELECT COUNT(*) as count FROM sources`),
    db.execute(sql`SELECT COUNT(*) as count FROM customers`),
  ]);

  const users = Number(teamsResult[0]?.count ?? 0);
  const stories = Number(storiesResult[0]?.count ?? 0);
  const insights = Number(highlightsResult[0]?.count ?? 0);
  const sources = Number(sourcesResult[0]?.count ?? 0);
  const customers = Number(customersResult[0]?.count ?? 0);

  return {
    users,
    stories,
    insights,
    sources,
    customers,
    // Legacy fields returning 0 for backward compatibility
    transactions: 0,
    bankAccounts: 0,
    trackerEntries: 0,
    inboxItems: 0,
    bankConnections: 0,
    trackerProjects: 0,
    reports: 0,
    vaultObjects: 0,
    transactionEnrichments: 0,
    invoices: 0,
    invoiceCustomers: customers, // Map to customers
  };
}
