import { createEnv } from '@t3-oss/env-nextjs';
import { keys as cms } from '@zeke/cms/keys';
import { keys as email } from '@zeke/email/keys';
import { keys as core } from '@zeke/next-config/keys';
import { keys as observability } from '@zeke/observability/keys';
import { keys as rateLimit } from '@zeke/rate-limit/keys';
import { keys as security } from '@zeke/security/keys';

export const env = createEnv({
  extends: [cms(), core(), email(), observability(), security(), rateLimit()],
  server: {},
  client: {},
  runtimeEnv: {},
});
