// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const sortParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
};

export function useSortParams() {
  const [params, setParams] = useQueryStates(sortParamsSchema);

  return { params, setParams };
}

export const loadSortParams = createLoader(sortParamsSchema);
