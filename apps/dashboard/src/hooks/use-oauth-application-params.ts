// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useOAuthApplicationParams() {
  const [params, setParams] = useQueryStates({
    applicationId: parseAsString,
    createApplication: parseAsBoolean,
    editApplication: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
