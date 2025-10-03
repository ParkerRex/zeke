import { checkHealth as checkDbHealth } from "@zeke/db/utils/health";

export async function checkHealth(): Promise<void> {
  await checkDbHealth();
}
