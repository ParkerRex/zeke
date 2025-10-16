"use client";

export function useTransactionFilterParamsWithPersistence() {
  return {
    filter: {},
    setFilter: () => {},
    hasFilters: false,
    clearAllFilters: () => {},
  };
}
