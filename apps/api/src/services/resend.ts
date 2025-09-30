import { Resend } from "resend";

// Use a fallback for development if RESEND_API_KEY is not set
const resendKey = process.env.RESEND_API_KEY || "re_development_dummy_key";

// Only initialize if we have a real key or are in development
export const resend = resendKey.startsWith("re_development")
  ? null
  : new Resend(resendKey);
