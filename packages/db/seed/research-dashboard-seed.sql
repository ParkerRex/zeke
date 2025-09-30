-- Research Dashboard Seed Data
-- This script populates the database with mock data for testing the research-focused dashboard
-- Date: 2025-09-25

-- Ensure we're in the public schema
SET search_path = public;

-- ============================================================================
-- 1. USERS AND TEAMS
-- ============================================================================

-- Create test team
INSERT INTO teams (id, name, slug, plan_code)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Research', 'acme-research', 'trial'),
  ('22222222-2222-2222-2222-222222222222', 'Beta Labs', 'beta-labs', 'pro')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  plan_code = EXCLUDED.plan_code;

-- Create test users
INSERT INTO users (id, email, full_name, team_id, locale, timezone)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@example.com', 'Alice Researcher', '11111111-1111-1111-1111-111111111111', 'en', 'America/New_York'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@example.com', 'Bob Analyst', '11111111-1111-1111-1111-111111111111', 'en', 'Europe/London'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'charlie@example.com', 'Charlie Manager', '22222222-2222-2222-2222-222222222222', 'en', 'Asia/Tokyo')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Create team memberships
INSERT INTO team_members (team_id, user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'owner')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ============================================================================
-- 2. CUSTOMERS AND GOALS
-- ============================================================================

INSERT INTO customers (id, team_id, name, persona)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Enterprise Tech Buyers', 'CTO/VP Engineering at 500+ employee companies'),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'AI Researchers', 'ML engineers and data scientists')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  persona = EXCLUDED.persona;

INSERT INTO team_goals (id, team_id, customer_id, created_by, title, goal_type, status, success_metrics)
VALUES
  ('g1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Understand AI adoption barriers', 'research', 'active',
   '{"target_insights": 10, "confidence_threshold": 0.8}'),
  ('g2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Track emerging AI frameworks', 'monitoring', 'active',
   '{"weekly_updates": true, "alert_threshold": "high"}')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- ============================================================================
-- 3. SOURCES AND RAW ITEMS
-- ============================================================================

-- Add research-focused sources
INSERT INTO sources (id, type, name, url, authority_score, is_active, metadata)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'rss', 'AI Research Blog', 'https://ai-research.example.com/feed', 0.95, true,
   '{"category": "research", "update_frequency": "daily"}'),
  ('s2222222-2222-2222-2222-222222222222', 'youtube_channel', 'AI Explained', 'https://youtube.com/@aiexplained', 0.85, true,
   '{"channel_id": "UCtest123", "category": "education"}'),
  ('s3333333-3333-3333-3333-333333333333', 'pdf', 'Research Papers Archive', NULL, 0.90, true,
   '{"source": "arxiv", "topics": ["machine_learning", "nlp"]}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  authority_score = EXCLUDED.authority_score;

-- Create raw items (ingested content)
INSERT INTO raw_items (id, source_id, external_id, kind, title, url, status, published_at, metadata)
VALUES
  ('r1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'article-001', 'article',
   'Breaking: GPT-5 Architecture Revealed', 'https://example.com/gpt5-revealed', 'processed',
   NOW() - INTERVAL '2 days', '{"author": "Dr. Smith", "tags": ["gpt", "architecture"]}'),

  ('r2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'article-002', 'article',
   'The Hidden Costs of LLM Training', 'https://example.com/llm-costs', 'processed',
   NOW() - INTERVAL '5 days', '{"author": "Prof. Johnson", "tags": ["economics", "training"]}'),

  ('r3333333-3333-3333-3333-333333333333', 's2222222-2222-2222-2222-222222222222', 'video-001', 'video',
   'Understanding Transformer Attention Mechanisms', 'https://youtube.com/watch?v=abc123', 'processed',
   NOW() - INTERVAL '1 week', '{"duration": 1200, "views": 50000}'),

  ('r4444444-4444-4444-4444-444444444444', 's3333333-3333-3333-3333-333333333333', 'paper-001', 'pdf',
   'Scaling Laws for Neural Language Models', 'https://arxiv.org/pdf/2001.08361', 'processed',
   NOW() - INTERVAL '3 days', '{"authors": ["Kaplan et al."], "citations": 1500}')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- ============================================================================
-- 4. CONTENTS
-- ============================================================================

INSERT INTO contents (id, raw_item_id, content_type, text_body, content_hash)
VALUES
  ('ct111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'text',
   'OpenAI researchers have unveiled the architecture behind GPT-5, revealing significant improvements in efficiency and reasoning capabilities. The new model uses a novel attention mechanism that reduces computational costs by 40% while improving performance on complex reasoning tasks...',
   MD5('content1')),

  ('ct222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 'text',
   'A comprehensive analysis of large language model training costs reveals hidden expenses often overlooked by organizations. Beyond compute costs, factors like data curation, human feedback, and infrastructure maintenance can triple the expected budget...',
   MD5('content2')),

  ('ct333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 'transcript',
   'In this video, we dive deep into how transformer attention mechanisms work. First, let''s understand the concept of self-attention...',
   MD5('content3')),

  ('ct444444-4444-4444-4444-444444444444', 'r4444444-4444-4444-4444-444444444444', 'text',
   'We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and the amount of compute used for training...',
   MD5('content4'))
ON CONFLICT (id) DO UPDATE SET
  text_body = EXCLUDED.text_body;

-- ============================================================================
-- 5. STORIES AND CLUSTERS
-- ============================================================================

-- Create story clusters
INSERT INTO story_clusters (id, cluster_key, label, metrics)
VALUES
  ('sc111111-1111-1111-1111-111111111111', 'gpt-5-development', 'GPT-5 Development News',
   '{"trending_score": 0.92, "relevance": 0.88, "freshness": 0.95}'),
  ('sc222222-2222-2222-2222-222222222222', 'llm-economics', 'LLM Economics & Costs',
   '{"trending_score": 0.75, "relevance": 0.90, "freshness": 0.70}')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label;

-- Create stories
INSERT INTO stories (id, content_id, cluster_id, title, summary, kind, primary_url, published_at)
VALUES
  ('st111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 'sc111111-1111-1111-1111-111111111111',
   'GPT-5 Architecture Breakthrough', 'Revolutionary improvements in efficiency and reasoning', 'article',
   'https://example.com/gpt5-revealed', NOW() - INTERVAL '2 days'),

  ('st222222-2222-2222-2222-222222222222', 'ct222222-2222-2222-2222-222222222222', 'sc222222-2222-2222-2222-222222222222',
   'Hidden Costs of LLM Training', 'Budget considerations beyond compute costs', 'article',
   'https://example.com/llm-costs', NOW() - INTERVAL '5 days'),

  ('st333333-3333-3333-3333-333333333333', 'ct333333-3333-3333-3333-333333333333', NULL,
   'Transformer Attention Deep Dive', 'Educational content on attention mechanisms', 'video',
   'https://youtube.com/watch?v=abc123', NOW() - INTERVAL '1 week'),

  ('st444444-4444-4444-4444-444444444444', 'ct444444-4444-4444-4444-444444444444', NULL,
   'Scaling Laws Research', 'Empirical analysis of model scaling', 'pdf',
   'https://arxiv.org/pdf/2001.08361', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary;

-- Add story overlays (why it matters)
INSERT INTO story_overlays (story_id, why_it_matters, confidence, analysis_state)
VALUES
  ('st111111-1111-1111-1111-111111111111',
   'GPT-5''s efficiency improvements could democratize AI by reducing costs and enabling deployment on smaller infrastructure',
   0.92, 'completed'),

  ('st222222-2222-2222-2222-222222222222',
   'Understanding true LLM costs helps organizations make informed decisions and avoid budget overruns in AI initiatives',
   0.88, 'completed'),

  ('st333333-3333-3333-3333-333333333333',
   'Deep understanding of attention mechanisms is crucial for engineers optimizing and debugging transformer models',
   0.85, 'completed'),

  ('st444444-4444-4444-4444-444444444444',
   'Scaling laws provide predictable frameworks for resource allocation and performance expectations in model development',
   0.90, 'completed')
ON CONFLICT (story_id) DO UPDATE SET
  why_it_matters = EXCLUDED.why_it_matters,
  confidence = EXCLUDED.confidence;

-- ============================================================================
-- 6. HIGHLIGHTS
-- ============================================================================

INSERT INTO highlights (id, story_id, team_id, created_by, kind, origin, title, summary, confidence, metadata)
VALUES
  ('h1111111-1111-1111-1111-111111111111', 'st111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'insight', 'assistant',
   '40% efficiency gain changes competitive landscape',
   'GPT-5''s efficiency improvements mean smaller companies can now compete with tech giants in AI deployment',
   0.88, '{"tags": ["competitive_analysis", "efficiency"]}'),

  ('h2222222-2222-2222-2222-222222222222', 'st222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'action', 'user',
   'Review and update AI budget projections',
   'Include hidden costs like data curation and human feedback in Q2 budget planning',
   0.95, '{"priority": "high", "deadline": "2024-02-15"}'),

  ('h3333333-3333-3333-3333-333333333333', 'st333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'quote', 'system',
   'Key quote on attention mechanisms',
   '"Self-attention allows the model to weigh the importance of different words regardless of their position"',
   0.90, '{"source": "video", "timestamp": 240}'),

  ('h4444444-4444-4444-4444-444444444444', 'st444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'question', 'user',
   'How do scaling laws apply to our models?',
   'Need to understand if our current model sizes are optimal based on available compute',
   0.75, '{"status": "open", "assigned_to": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary;

-- ============================================================================
-- 7. PLAYBOOK TEMPLATES AND PLAYBOOKS
-- ============================================================================

-- Create playbook templates
INSERT INTO playbook_templates (id, title, description, target_role, is_public, created_by)
VALUES
  ('pt111111-1111-1111-1111-111111111111', 'AI Technology Assessment',
   'Evaluate new AI technologies for adoption', 'Product Manager', true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

  ('pt222222-2222-2222-2222-222222222222', 'Competitive Intelligence Brief',
   'Analyze competitor AI capabilities', 'Strategy Lead', true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Create template steps
INSERT INTO playbook_template_steps (id, template_id, title, output_type, position, default_payload)
VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pt111111-1111-1111-1111-111111111111',
   'Gather technical specifications', 'document', 0, '{"required_fields": ["performance", "cost", "integration"]}'),

  ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pt111111-1111-1111-1111-111111111111',
   'Assess team readiness', 'checklist', 1, '{"items": ["skills_gap", "training_needs", "timeline"]}'),

  ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pt222222-2222-2222-2222-222222222222',
   'Identify key competitors', 'list', 0, '{"min_items": 3, "max_items": 10}')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  position = EXCLUDED.position;

-- Create active playbooks
INSERT INTO playbooks (id, team_id, story_id, template_id, created_by, status)
VALUES
  ('11111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'st111111-1111-1111-1111-111111111111', 'pt111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'active'),

  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'st222222-2222-2222-2222-222222222222', 'pt222222-2222-2222-2222-222222222222',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'draft')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- ============================================================================
-- 8. CHAT DATA (New Assistant)
-- ============================================================================

-- Create sample chats
INSERT INTO chats (id, team_id, user_id, title, created_at, updated_at)
VALUES
  ('chat001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'GPT-5 implications for our product', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  ('chat002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Cost analysis for LLM deployment', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  ('chat003', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Transformer architecture questions', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = EXCLUDED.updated_at;

-- Create sample chat messages
INSERT INTO chat_messages (chat_id, team_id, user_id, content, created_at)
VALUES
  ('chat001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"role": "user", "content": "What are the key implications of GPT-5''s efficiency improvements for our product roadmap?", "id": "msg1"}',
   NOW() - INTERVAL '1 day'),

  ('chat001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"role": "assistant", "content": "Based on the recent GPT-5 architecture revelations, here are the key implications:\n\n1. **Reduced Infrastructure Costs**: The 40% efficiency gain means you could run similar capabilities with significantly less compute.\n\n2. **Faster Response Times**: Improved efficiency translates to lower latency for end users.\n\n3. **Competitive Advantage**: Early adoption could differentiate your product while competitors are still using older, less efficient models.", "id": "msg2"}',
   NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),

  ('chat002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"role": "user", "content": "Break down the hidden costs mentioned in the LLM training article", "id": "msg3"}',
   NOW() - INTERVAL '3 days'),

  ('chat002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"role": "assistant", "content": "The article identifies several hidden costs beyond compute:\n\n**Data Curation (30% of budget)**\n- Cleaning and preprocessing\n- Quality validation\n- License fees for proprietary datasets\n\n**Human Feedback (25% of budget)**\n- RLHF annotation teams\n- Subject matter expert reviews\n- Quality assurance processes\n\n**Infrastructure (20% of budget)**\n- Data storage and transfer\n- Monitoring and logging\n- Backup and disaster recovery", "id": "msg4"}',
   NOW() - INTERVAL '3 days' + INTERVAL '1 minute')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. TEAM STATES AND ACTIVITIES
-- ============================================================================

-- Set story states for teams
INSERT INTO team_story_states (team_id, story_id, state, pinned, rating)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'st111111-1111-1111-1111-111111111111', 'read', true, 5),
  ('11111111-1111-1111-1111-111111111111', 'st222222-2222-2222-2222-222222222222', 'read', false, 4),
  ('11111111-1111-1111-1111-111111111111', 'st333333-3333-3333-3333-333333333333', 'unread', false, NULL)
ON CONFLICT (team_id, story_id) DO UPDATE SET
  state = EXCLUDED.state,
  pinned = EXCLUDED.pinned;

-- Create activity feed
INSERT INTO activities (team_id, actor_id, type, visibility, story_id, highlight_id, metadata, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'story_pinned', 'team',
   'st111111-1111-1111-1111-111111111111', NULL, '{"reason": "Critical for Q1 planning"}', NOW() - INTERVAL '2 hours'),

  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'highlight_created', 'team',
   'st222222-2222-2222-2222-222222222222', 'h2222222-2222-2222-2222-222222222222',
   '{"highlight_type": "action"}', NOW() - INTERVAL '4 hours'),

  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'playbook_created', 'team',
   'st111111-1111-1111-1111-111111111111', NULL, '{"playbook_id": "11111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}',
   NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. PIPELINE STATUS (Metrics)
-- ============================================================================

-- Add source health metrics
INSERT INTO source_health (source_id, status, last_success_at, message)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'ok', NOW() - INTERVAL '1 hour', 'Successfully ingested 5 new articles'),
  ('s2222222-2222-2222-2222-222222222222', 'ok', NOW() - INTERVAL '2 hours', 'Processed 3 new videos'),
  ('s3333333-3333-3333-3333-333333333333', 'warn', NOW() - INTERVAL '12 hours', 'Rate limit approaching')
ON CONFLICT (source_id) DO UPDATE SET
  status = EXCLUDED.status,
  last_success_at = EXCLUDED.last_success_at;

-- Platform quota tracking
INSERT INTO platform_quota (provider, quota_limit, used, remaining, reset_at)
VALUES
  ('openai', 1000000, 450000, 550000, NOW() + INTERVAL '30 days'),
  ('youtube', 10000, 2500, 7500, NOW() + INTERVAL '24 hours')
ON CONFLICT (provider) DO UPDATE SET
  used = EXCLUDED.used,
  remaining = EXCLUDED.remaining,
  reset_at = EXCLUDED.reset_at;

-- Output summary
DO $$
BEGIN
  RAISE NOTICE 'Research dashboard seed data loaded successfully!';
  RAISE NOTICE '- Teams: 2';
  RAISE NOTICE '- Users: 3';
  RAISE NOTICE '- Stories: 4';
  RAISE NOTICE '- Highlights: 4';
  RAISE NOTICE '- Chats: 3';
  RAISE NOTICE '- Playbooks: 2';
END $$;