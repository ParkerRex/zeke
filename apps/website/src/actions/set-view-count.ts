"use server";

import { client } from "@zeke/kv";

export async function setViewCount(path: string) {
	return client.incr(`views-${path}`);
}
