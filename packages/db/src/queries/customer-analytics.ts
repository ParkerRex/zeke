// Customer analytics temporarily disabled during migration to Zeke
// This file will be reimplemented with the new analytics system

import type { Database } from "@db/client";

export type GetTopRevenueClientParams = {
  teamId: string;
};

export async function getTopRevenueClient(
  db: Database,
  params: GetTopRevenueClientParams,
) {
  // Temporarily return null during migration
  return null;
}

export type GetCustomerRevenueParams = {
  teamId: string;
  customerId: string;
  startDate?: Date;
  endDate?: Date;
};

export async function getCustomerRevenue(
  db: Database,
  params: GetCustomerRevenueParams,
) {
  // Temporarily return 0 during migration
  return {
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
  };
}

export type GetCustomerMetricsParams = {
  teamId: string;
  customerId: string;
};

export async function getCustomerMetrics(
  db: Database,
  params: GetCustomerMetricsParams,
) {
  // Temporarily return empty metrics during migration
  return {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    averagePaymentTime: null,
    lifetimeValue: 0,
  };
}
