"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import {
  EMPTY_FILTER_STATE,
  type FilterHookReturn,
  type TransactionFilters,
} from "@/utils/transaction-filters";
import { useCallback } from "react";
import { useTransactionFilterParams } from "./use-transaction-filter-params";

export function useTransactionFilterParamsWithPersistence(): FilterHookReturn<TransactionFilters> {
  const { filter, setFilter, hasFilters } = useTransactionFilterParams();

  const clearAllFilters = useCallback(() => {
    setFilter(EMPTY_FILTER_STATE);
  }, [setFilter]);

  return {
    filter,
    setFilter,
    hasFilters,
    clearAllFilters,
  };
}
