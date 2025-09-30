"use server";

import { createServerClient } from "@supabase/ssr";
import type { Database } from "@zeke/supabase/types";

export async function fetchStats() {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
    },
  );

  const supabaseStorage = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
      db: { schema: "storage" },
    },
  );

  // Query only existing tables - removed trackerProjects, invoices, and other finance tables
  const [
    { count: users },
    { count: stories },
    { count: insights },
    { count: sources },
    { count: customers },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .limit(1),
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .limit(1),
    supabase
      .from("highlights")
      .select("id", { count: "exact", head: true })
      .limit(1),
    supabase
      .from("sources")
      .select("id", { count: "exact", head: true })
      .limit(1),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .limit(1),
  ]);

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
