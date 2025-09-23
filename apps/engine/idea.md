zeke-engine/
  ├── apps/
  │   ├── api/                 # REST/GraphQL for internal
  consumers
  │   ├── studio/              # Ops dashboard for source
  health & curation
  │   └── hooks/               # Webhook delivery surface
  (Slack/Discord/etc.)
  ├── services/
  │   ├── scheduler/           # Temporal/Cron orchestrators
  │   ├── workers/             # Queue workers for ingestion
  + enrich
  │   └── web-sockets/         # Realtime update channel
  (optional)
  ├── packages/
  │   ├── connectors/
  │   │   ├── rss/
  │   │   ├── newsletters/     # IMAP/Gmail parsers
  │   │   ├── podcasts/
  │   │   ├── video/           # YouTube/TikTok pullers
  │   │   ├── community/       # Reddit, HN, Discord, Slack,
  GitHub
  │   │   └── research/        # Semantic Scholar, arXiv,
  patents, gov
  │   ├── normalization/       # Schema transforms, taxonomy
  mapping
  │   ├── enrichment/          # NLP summarization, tagging,
  dedupe
  │   ├── scoring/             # Signal ranking & alert
  thresholds
  │   ├── deliveries/          # Notion, Slack, email, webhook
  clients
  │   ├── clients/
  │   │   ├── node/
  │   │   └── python/
  │   ├── infra-shared/        # Logging, tracing, feature
  flags
  │   └── testing/             # Fixtures/mocks for connectors
  ├── data/
  │   ├── migrations/          # Database schema, vector store
  setup
  │   ├── seeds/
  │   └── models/              # Prisma/Drizzle/SQL models
  ├── pipelines/
  │   ├── realtime/            # Stream processors (Kafka/
  PubSub)
  │   ├── batch/               # Nightly aggregation jobs
  │   └── retraining/          # Model fine-tuning workflows
  ├── config/
  │   ├── sources.yml          # Source catalog + auth metadata
  │   ├── alerts.yml
  │   └── routing.yml          # Delivery routing rules
  ├── infra/
  │   ├── terraform/           # Cloud infra as code
  │   ├── kubernetes/          # Helm charts / manifests
  │   ├── cloudflare/          # Workers, queues
  │   └── monitoring/          # Grafana, Alertmanager configs
  ├── docs/
  │   ├── architecture/
  │   ├── api/
  │   └── operations/
  ├── scripts/                 # DX scripts, local dev
  bootstrap
  ├── tests/
  │   ├── integration/
  │   ├── load/
  │   └── smoke/
  ├── tools/                   # CLIs for source testing,
  replay, triage
  └── .github/                 # CI pipelines, issue templates