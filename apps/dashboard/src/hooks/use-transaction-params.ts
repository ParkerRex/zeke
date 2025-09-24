// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

export function useTransactionParams() {
  const [params, setParams] = useQueryStates({
    transactionId: parseAsString,
    createTransaction: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
