// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const customerFilterParamsSchema = {
  q: parseAsString,
  sort: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export function useCustomerFilterParams() {
  const [filter, setFilter] = useQueryStates(customerFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadCustomerFilterParams = createLoader(
  customerFilterParamsSchema,
);
