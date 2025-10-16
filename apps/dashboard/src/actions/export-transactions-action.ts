"use server";

import { z } from "zod";
import { authActionClient } from "./safe-action";

export const exportTransactionsAction = authActionClient
  .schema(
    z.object({
      transactionIds: z.array(z.string()),
      dateFormat: z.string().optional(),
      locale: z.string().optional().default("en"),
    }),
  )
  .action(async () => {
    return {};
  });
