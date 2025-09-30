// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

export function useConnectParams(initialCountryCode?: string) {
  const [params, setParams] = useQueryStates({
    step: parseAsStringLiteral(["connect", "account", "import"]),
    countryCode: parseAsString.withDefault(initialCountryCode ?? ""),
    provider: parseAsStringLiteral([
      "teller",
      "plaid",
      "gocardless",
      "enablebanking",
    ]),
    token: parseAsString,
    enrollment_id: parseAsString,
    institution_id: parseAsString,
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    error: parseAsString,
    ref: parseAsString,
    details: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
