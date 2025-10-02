import { createHash, timingSafeEqual } from "node:crypto";

export type OAuthApplication = {
  id: string;
  active: boolean | null;
  clientSecret: string;
};

function hash(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

export function validateClientCredentials(
  application: OAuthApplication | null | undefined,
  clientSecret: string,
): boolean {
  if (!application || !application.active) {
    return false;
  }

  const hashedSecret = hash(clientSecret);
  const storedSecret = application.clientSecret;

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(Buffer.from(storedSecret), Buffer.from(hashedSecret));
}
