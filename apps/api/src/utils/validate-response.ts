// Utility to enforce response shape via Zod and log mismatches before returning errors.
import { logger } from "@zeke/logger";
import type { ZodSchema } from "zod";
// TODO: UPDATE THIS TO ZEKE LOGIC
export const validateResponse = (data: any, schema: ZodSchema) => {
	const result = schema.safeParse(data);

	if (!result.success) {
		const cause = result.error.flatten();

		logger.error(cause);

		return {
			success: false,
			error: "Response validation failed",
			details: cause,
			data: null,
		};
	}

	return result.data;
};
