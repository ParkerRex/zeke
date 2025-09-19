"use server";

import { fetchActiveProductsWithPrices } from "@/utils/billing";
import { actionClient } from "../safe-action";
import { getProductsInputSchema } from "../schemas/billing";

export const getBillingProductsAction = actionClient
  .schema(getProductsInputSchema)
  .metadata({
    name: "get-billing-products",
  })
  .action(async () => {
    return fetchActiveProductsWithPrices();
  });
