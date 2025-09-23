import { hc } from "hono/client";

export const client = hc(`${process.env.ENGINE_API_URL}/`, {
	headers: {
		Authorization: `Bearer ${process.env.ENGINE_API_KEY}`,
	},
});
