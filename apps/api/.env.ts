import { keys as analytics } from '@zeke/analytics/keys';
import { keys as auth } from '@zeke/auth/keys';
import { keys as database } from '@zeke/supabase/keys';
import { keys as email } from '@zeke/email/keys';
import { keys as core } from '@zeke/next-config/keys';
import { keys as observability } from '@zeke/observability/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    core(),
    database(),
    email(),
    observability(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
