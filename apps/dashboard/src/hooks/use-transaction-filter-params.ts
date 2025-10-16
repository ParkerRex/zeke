export const transactionFilterParamsSchema = {};

export function useTransactionFilterParams() {
  return {
    filter: {},
    setFilter: () => {},
    hasFilters: false,
  };
}

export const loadTransactionFilterParams = () => ({});
