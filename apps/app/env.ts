import { createEnv } from '@t3-oss/env-nextjs';
import { keys as analytics } from '@zeke/analytics/keys';
import { keys as auth } from '@zeke/auth/keys';
import { keys as email } from '@zeke/email/keys';
import { keys as core } from '@zeke/next-config/keys';
import { keys as observability } from '@zeke/observability/keys';
import { keys as security } from '@zeke/security/keys';
import { keys as supabase } from '@zeke/supabase/keys';

export const env = createEnv({
  extends: [
    analytics(),
    auth(),
    core(),
    email(),
    observability(),
    security(),
    supabase(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
