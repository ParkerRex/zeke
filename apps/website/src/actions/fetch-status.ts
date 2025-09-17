"use server";

import { getStatus } from "@openstatus/react";

export async function fetchStatus() {
	const res = await getStatus("zeke");

	const { status } = res;

	return status;
}
