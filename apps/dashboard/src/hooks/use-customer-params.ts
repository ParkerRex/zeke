// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useCustomerParams() {
  const [params, setParams] = useQueryStates({
    customerId: parseAsString,
    createCustomer: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
