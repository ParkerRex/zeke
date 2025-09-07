-- Example RSS sources (optional seed)
insert into public.sources (kind, name, url, domain)
values
  ('rss', 'Hacker News – Front Page', 'https://hnrss.org/frontpage', 'news.ycombinator.com'),
  ('rss', 'Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'arstechnica.com')
on conflict do nothing;

-- pg-boss schedules (optional seed; worker also schedules these on startup)
insert into pgboss.schedule (name, cron, timezone, data, options)
values
  ('system:heartbeat', '*/5 * * * *', 'UTC', '{"ping": "ok"}', '{"tz": "UTC"}'),
  ('ingest:pull', '*/15 * * * *', 'UTC', '{"source": "youtube"}', '{"tz": "UTC"}')
on conflict do nothing;

-- pg-boss schema version (idempotent)
insert into pgboss.version (version)
values (24)
on conflict do nothing;

-- YouTube AI-Focused Sources
-- Insert AI research channels, tech/startup channels, and search queries
insert into public.sources (kind, name, url, domain, metadata)
values
  -- AI Research Channels (High Priority)
  ('youtube_channel', 'Lex Fridman Podcast', 'https://www.youtube.com/@lexfridman', 'youtube.com',
   '{"channel_id": "UCSHZKyawb77ixDdsGog4iWA", "upload_playlist_id": "UUSHZKyawb77ixDdsGog4iWA", "category": "ai_research", "priority": "high", "max_videos_per_run": 10}'),

  ('youtube_channel', 'Two Minute Papers', 'https://www.youtube.com/@TwoMinutePapers', 'youtube.com',
   '{"channel_id": "UCbfYPyITQ-7l4upoX8nvctg", "upload_playlist_id": "UUbfYPyITQ-7l4upoX8nvctg", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}'),

  ('youtube_channel', 'Anthropic', 'https://www.youtube.com/@AnthropicAI', 'youtube.com',
   '{"channel_id": "UCpvYfVOIbW2Tz9Qs8rdvp7w", "upload_playlist_id": "UUpvYfVOIbW2Tz9Qs8rdvp7w", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}'),

  ('youtube_channel', 'OpenAI', 'https://www.youtube.com/@OpenAI', 'youtube.com',
   '{"channel_id": "UCXZCJLdBC09xxGZ6gcdrc6A", "upload_playlist_id": "UUXZCJLdBC09xxGZ6gcdrc6A", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}'),

  ('youtube_channel', 'DeepMind', 'https://www.youtube.com/@DeepMind', 'youtube.com',
   '{"channel_id": "UCP7jMXSY2xbc3KCAE0MHQ-A", "upload_playlist_id": "UUP7jMXSY2xbc3KCAE0MHQ-A", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}'),

  ('youtube_channel', 'MIT CSAIL', 'https://www.youtube.com/@MITCSAIL', 'youtube.com',
   '{"channel_id": "UCBpxspUNl1Th33XbugiHJzw", "upload_playlist_id": "UUBpxspUNl1Th33XbugiHJzw", "category": "ai_research", "priority": "high", "max_videos_per_run": 8}'),

  ('youtube_channel', 'Stanford HAI', 'https://www.youtube.com/@StanfordHAI', 'youtube.com',
   '{"channel_id": "UC4R8DWoMoI7CAwX8_LjQHig", "upload_playlist_id": "UU4R8DWoMoI7CAwX8_LjQHig", "category": "ai_research", "priority": "high", "max_videos_per_run": 6}'),

  -- Tech/Startup AI Channels (Medium Priority)
  ('youtube_channel', 'Y Combinator', 'https://www.youtube.com/@ycombinator', 'youtube.com',
   '{"channel_id": "UCcefcZRL2oaA_uBNeo5UOWg", "upload_playlist_id": "UUcefcZRL2oaA_uBNeo5UOWg", "category": "startup_tech", "priority": "medium", "max_videos_per_run": 8}'),

  -- AI Conference Channels (Medium Priority)
  ('youtube_channel', 'NeurIPS', 'https://www.youtube.com/@NeurIPSConf', 'youtube.com',
   '{"channel_id": "UC_4dWbdOgJwZHWP-FGlx2yw", "upload_playlist_id": "UU_4dWbdOgJwZHWP-FGlx2yw", "category": "ai_research", "priority": "medium", "max_videos_per_run": 10}'),

  ('youtube_channel', 'ICML', 'https://www.youtube.com/@ICMLConf', 'youtube.com',
   '{"channel_id": "UC74C4hHWkAWDp5LrHmZbfvA", "upload_playlist_id": "UU74C4hHWkAWDp5LrHmZbfvA", "category": "ai_research", "priority": "medium", "max_videos_per_run": 8}'),

  -- Search-Based Discovery (Lower Priority, Higher Quota Cost)
  ('youtube_search', 'AI Research Papers 2024', NULL, 'youtube.com',
   '{"query": "AI research paper explained 2024", "order": "date", "max_results": 10, "published_after": "2024-01-01T00:00:00Z", "duration": "medium", "category": "ai_research"}'),

  ('youtube_search', 'AI Startup Funding 2024', NULL, 'youtube.com',
   '{"query": "AI startup funding announcement 2024", "order": "relevance", "max_results": 5, "published_after": "2024-01-01T00:00:00Z", "category": "startup_news"}'),

  ('youtube_search', 'AI Breakthrough 2024', NULL, 'youtube.com',
   '{"query": "AI breakthrough announcement 2024", "order": "date", "max_results": 8, "published_after": "2024-01-01T00:00:00Z", "duration": "medium", "category": "ai_research"}')
on conflict do nothing;
