import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    client: {
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().startsWith('eyJ'),
      NEXT_PUBLIC_SUPABASE_SIGN_IN_URL: z.string().startsWith('/'),
      NEXT_PUBLIC_SUPABASE_SIGN_UP_URL: z.string().startsWith('/'),
      NEXT_PUBLIC_SUPABASE_AFTER_SIGN_IN_URL: z.string().startsWith('/'),
      NEXT_PUBLIC_SUPABASE_AFTER_SIGN_UP_URL: z.string().startsWith('/'),
    },
    runtimeEnv: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_SUPABASE_SIGN_IN_URL,
      NEXT_PUBLIC_SUPABASE_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_SUPABASE_SIGN_UP_URL,
      NEXT_PUBLIC_SUPABASE_AFTER_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_SUPABASE_AFTER_SIGN_IN_URL,
      NEXT_PUBLIC_SUPABASE_AFTER_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_SUPABASE_AFTER_SIGN_UP_URL,
    },
  });
