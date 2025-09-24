// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const inboxParamsSchema = {
  inboxId: parseAsString,
  type: parseAsStringLiteral(["list", "details"]),
  order: parseAsStringLiteral(["asc", "desc"]).withDefault("asc"),
  connected: parseAsBoolean,
};

export function useInboxParams() {
  const [params, setParams] = useQueryStates(inboxParamsSchema);

  return {
    params,
    setParams,
  };
}

export const loadInboxParams = createLoader(inboxParamsSchema);
