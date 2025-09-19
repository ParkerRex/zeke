import { Polar } from "@polar-sh/sdk";
// TODO: UPDATE THIS TO ZEKE LOGIC (stripe)

export const api = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	server: process.env.POLAR_ENVIRONMENT as "production" | "sandbox",
});
