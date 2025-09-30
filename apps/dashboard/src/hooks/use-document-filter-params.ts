// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const documentFilterParamsSchema = {
  q: parseAsString,
  tags: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export function useDocumentFilterParams() {
  const [filter, setFilter] = useQueryStates(documentFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadDocumentFilterParams = createLoader(
  documentFilterParamsSchema,
);
