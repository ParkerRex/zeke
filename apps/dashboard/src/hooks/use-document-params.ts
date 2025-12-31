// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useQueryStates } from "nuqs";
import { parseAsString, parseAsStringLiteral } from "nuqs/server";

export function useDocumentParams() {
  const [params, setParams] = useQueryStates({
    documentId: parseAsString,
    filePath: parseAsString,
    view: parseAsStringLiteral(["grid", "list"]).withDefault("grid"),
  });

  return {
    params,
    setParams,
  };
}
