#!/bin/bash

# Emergency Rollback Script for Security Hardening
# This script provides a safe way to rollback the security hardening changes
# if they cause issues with application functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  EMERGENCY ROLLBACK: Security Hardening${NC}"
echo "=================================================="
echo ""
echo "This script will rollback the security hardening changes."
echo "This should only be used if the security fixes are causing issues."
echo ""

# Confirmation prompt
read -p "Are you sure you want to rollback the security hardening? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    echo -e "${YELLOW}Rollback cancelled.${NC}"
    exit 0
fi

# Determine environment
if [[ "$1" == "--production" ]]; then
    ENVIRONMENT="production"
    DB_FLAG="--linked"
    echo -e "${RED}🚨 PRODUCTION ROLLBACK${NC}"
else
    ENVIRONMENT="local"
    DB_FLAG="--local"
    echo -e "${YELLOW}📍 Local rollback${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Starting security rollback process...${NC}"

# Create backup before rollback
echo -e "\n${YELLOW}📦 Creating backup before rollback...${NC}"
BACKUP_FILE="backup_before_security_rollback_$(date +%Y%m%d_%H%M%S).sql"
if [[ "$ENVIRONMENT" == "production" ]]; then
    supabase db dump --linked > "$BACKUP_FILE"
else
    supabase db dump --local > "$BACKUP_FILE"
fi
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Rollback SQL for function search path security
echo -e "\n${YELLOW}🔄 Rolling back function search path security...${NC}"

if [[ "$ENVIRONMENT" == "local" ]]; then
    DB_CONNECTION="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    
    # Rollback function security settings
    psql "$DB_CONNECTION" << 'EOF'
-- Rollback is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = (SELECT auth.uid())),
    false
  );
$$;

-- Rollback is_worker_role function
CREATE OR REPLACE FUNCTION public.is_worker_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT current_user = 'worker';
$$;

-- Rollback handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  RETURN NEW;
END;
$$;

-- Rollback get_youtube_sources function
CREATE OR REPLACE FUNCTION public.get_youtube_sources()
RETURNS TABLE(
  id uuid,
  kind text,
  name text,
  url text,
  domain text,
  metadata jsonb,
  last_cursor jsonb
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    s.id, 
    s.kind, 
    s.name, 
    s.url, 
    s.domain, 
    s.metadata, 
    s.last_cursor
  FROM public.sources s
  WHERE s.kind IN ('youtube_channel', 'youtube_search') 
    AND s.metadata IS NOT NULL;
$$;

-- Rollback refresh_source_metrics function
CREATE OR REPLACE FUNCTION public.refresh_source_metrics(_source_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Original function body without search_path setting
  IF _source_id IS NULL THEN
    INSERT INTO source_metrics AS m (
      source_id, raw_total, contents_total, stories_total, raw_24h, contents_24h, stories_24h, last_raw_at, last_content_at, last_story_at, updated_at
    )
    SELECT 
      s.id,
      COALESCE((SELECT count(*) FROM raw_items r WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM raw_items r WHERE r.source_id = s.id AND r.discovered_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND c.extracted_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND st.created_at > now() - interval '24 hours'), 0),
      (SELECT max(discovered_at) FROM raw_items r WHERE r.source_id = s.id),
      (SELECT max(extracted_at) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      (SELECT max(st.created_at) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      now()
    FROM sources s
    ON CONFLICT (source_id) DO UPDATE SET
      raw_total = EXCLUDED.raw_total,
      contents_total = EXCLUDED.contents_total,
      stories_total = EXCLUDED.stories_total,
      raw_24h = EXCLUDED.raw_24h,
      contents_24h = EXCLUDED.contents_24h,
      stories_24h = EXCLUDED.stories_24h,
      last_raw_at = EXCLUDED.last_raw_at,
      last_content_at = EXCLUDED.last_content_at,
      last_story_at = EXCLUDED.last_story_at,
      updated_at = EXCLUDED.updated_at;
  ELSE
    INSERT INTO source_metrics AS m (
      source_id, raw_total, contents_total, stories_total, raw_24h, contents_24h, stories_24h, last_raw_at, last_content_at, last_story_at, updated_at
    )
    SELECT 
      s.id,
      COALESCE((SELECT count(*) FROM raw_items r WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id), 0),
      COALESCE((SELECT count(*) FROM raw_items r WHERE r.source_id = s.id AND r.discovered_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND c.extracted_at > now() - interval '24 hours'), 0),
      COALESCE((SELECT count(*) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id AND st.created_at > now() - interval '24 hours'), 0),
      (SELECT max(discovered_at) FROM raw_items r WHERE r.source_id = s.id),
      (SELECT max(extracted_at) FROM contents c JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      (SELECT max(st.created_at) FROM stories st JOIN contents c ON c.id = st.content_id JOIN raw_items r ON r.id = c.raw_item_id WHERE r.source_id = s.id),
      now()
    FROM sources s 
    WHERE s.id = _source_id
    ON CONFLICT (source_id) DO UPDATE SET
      raw_total = EXCLUDED.raw_total,
      contents_total = EXCLUDED.contents_total,
      stories_total = EXCLUDED.stories_total,
      raw_24h = EXCLUDED.raw_24h,
      contents_24h = EXCLUDED.contents_24h,
      stories_24h = EXCLUDED.stories_24h,
      last_raw_at = EXCLUDED.last_raw_at,
      last_content_at = EXCLUDED.last_content_at,
      last_story_at = EXCLUDED.last_story_at,
      updated_at = EXCLUDED.updated_at;
  END IF;
END;
$$;

-- Rollback trigger functions
CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_raw_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM refresh_source_metrics(NEW.source_id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_contents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  _sid uuid;
BEGIN
  SELECT r.source_id INTO _sid 
  FROM raw_items r 
  WHERE r.id = NEW.raw_item_id;
  
  IF _sid IS NOT NULL THEN 
    PERFORM refresh_source_metrics(_sid); 
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_metrics_on_stories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  _sid uuid;
BEGIN
  SELECT r.source_id INTO _sid 
  FROM raw_items r 
  JOIN contents c ON c.id = NEW.content_id AND c.raw_item_id = r.id;
  
  IF _sid IS NOT NULL THEN 
    PERFORM refresh_source_metrics(_sid); 
  END IF;
  
  RETURN NULL;
END;
$$;
EOF

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Function security rollback completed${NC}"
    else
        echo -e "${RED}❌ Function security rollback failed${NC}"
        exit 1
    fi

    # Rollback vector extension to public schema
    echo -e "\n${YELLOW}🔄 Rolling back vector extension to public schema...${NC}"
    
    psql "$DB_CONNECTION" << 'EOF'
-- Drop vector extension from extensions schema
DROP EXTENSION IF EXISTS vector CASCADE;

-- Recreate in public schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Restore search_path
ALTER DATABASE postgres RESET search_path;
SET search_path = public;

-- Recreate vector columns if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'story_embeddings') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'story_embeddings' 
                       AND column_name = 'embedding') THEN
            
            ALTER TABLE public.story_embeddings 
            ADD COLUMN embedding vector(1536);
            
            CREATE INDEX IF NOT EXISTS story_embeddings_l2_idx 
            ON public.story_embeddings 
            USING ivfflat (embedding vector_l2_ops) 
            WITH (lists = 100);
        END IF;
    END IF;
END;
$$;
EOF

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Vector extension rollback completed${NC}"
    else
        echo -e "${RED}❌ Vector extension rollback failed${NC}"
        exit 1
    fi

else
    echo "Production rollback requires manual SQL execution via Supabase Dashboard"
    echo "Apply the rollback SQL from the local version manually"
fi

echo -e "\n${GREEN}🎉 Security Rollback Completed!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "- Function search_path security settings removed"
echo "- Vector extension moved back to public schema"
echo "- Original function security context restored"
echo "- Database backup created: $BACKUP_FILE"
echo ""
echo "⚠️  WARNING: The database is now vulnerable to the original security issues"
echo "Only use this rollback temporarily while investigating issues"
