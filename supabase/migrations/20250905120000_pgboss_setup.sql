-- pg-boss setup migration
-- This creates all the necessary pg-boss tables and functions in the pgboss schema
-- Based on pg-boss v10.3.2 schema version 24

-- Create worker role if it doesn't exist (for local development)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'worker') THEN
    CREATE ROLE worker WITH LOGIN PASSWORD 'worker_password';
  END IF;
END
$$;

-- Ensure pgboss schema exists
CREATE SCHEMA IF NOT EXISTS pgboss;

-- Create job state enum
CREATE TYPE pgboss.job_state AS ENUM (
  'created',
  'retry',
  'active',
  'completed',
  'cancelled',
  'failed'
);

-- Create version table
CREATE TABLE pgboss.version (
  version int primary key,
  maintained_on timestamp with time zone,
  cron_on timestamp with time zone,
  monitored_on timestamp with time zone
);

-- Create queue table
CREATE TABLE pgboss.queue (
  name text,
  policy text,
  retry_limit int,
  retry_delay int,
  retry_backoff bool,
  expire_seconds int,
  retention_minutes int,
  dead_letter text REFERENCES pgboss.queue (name),
  partition_name text,
  created_on timestamp with time zone not null default now(),
  updated_on timestamp with time zone not null default now(),
  PRIMARY KEY (name)
);

-- Create schedule table
CREATE TABLE pgboss.schedule (
  name text REFERENCES pgboss.queue ON DELETE CASCADE,
  cron text not null,
  timezone text,
  data jsonb,
  options jsonb,
  created_on timestamp with time zone not null default now(),
  updated_on timestamp with time zone not null default now(),
  PRIMARY KEY (name)
);

-- Create subscription table
CREATE TABLE pgboss.subscription (
  event text not null,
  name text not null REFERENCES pgboss.queue ON DELETE CASCADE,
  created_on timestamp with time zone not null default now(),
  updated_on timestamp with time zone not null default now(),
  PRIMARY KEY(event, name)
);

-- Create job table (partitioned)
CREATE TABLE pgboss.job (
  id uuid not null default gen_random_uuid(),
  name text not null,
  priority integer not null default(0),
  data jsonb,
  state pgboss.job_state not null default('created'),
  retry_limit integer not null default(2),
  retry_count integer not null default(0),
  retry_delay integer not null default(0),
  retry_backoff boolean not null default false,
  start_after timestamp with time zone not null default now(),
  started_on timestamp with time zone,
  singleton_key text,
  singleton_on timestamp without time zone,
  expire_in interval not null default interval '15 minutes',
  created_on timestamp with time zone not null default now(),
  completed_on timestamp with time zone,
  keep_until timestamp with time zone NOT NULL default now() + interval '14 days',
  output jsonb,
  dead_letter text,
  policy text
) PARTITION BY LIST (name);

-- Add primary key to job table
ALTER TABLE pgboss.job ADD PRIMARY KEY (name, id);

-- Create archive table
CREATE TABLE pgboss.archive (LIKE pgboss.job);

-- Add primary key to archive table
ALTER TABLE pgboss.archive ADD PRIMARY KEY (name, id);

-- Add archived_on column to archive table
ALTER TABLE pgboss.archive ADD archived_on timestamptz NOT NULL DEFAULT now();

-- Create index on archive table
CREATE INDEX archive_i1 ON pgboss.archive(archived_on);

-- Create queue function
CREATE OR REPLACE FUNCTION pgboss.create_queue(queue_name text, options json)
RETURNS VOID AS
$$
DECLARE
  table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
  queue_created_on timestamptz;
BEGIN

  WITH q as (
    INSERT INTO pgboss.queue (
      name,
      policy,
      retry_limit,
      retry_delay,
      retry_backoff,
      expire_seconds,
      retention_minutes,
      dead_letter,
      partition_name
    )
    VALUES (
      queue_name,
      options->>'policy',
      (options->>'retryLimit')::int,
      (options->>'retryDelay')::int,
      (options->>'retryBackoff')::bool,
      (options->>'expireInSeconds')::int,
      (options->>'retentionMinutes')::int,
      options->>'deadLetter',
      table_name
    )
    ON CONFLICT DO NOTHING
    RETURNING created_on
  )
  SELECT created_on into queue_created_on from q;

  IF queue_created_on IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('CREATE TABLE pgboss.%I (LIKE pgboss.job INCLUDING DEFAULTS)', table_name);

  EXECUTE format('ALTER TABLE pgboss.%1$I ADD PRIMARY KEY (name, id)', table_name);
  EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
  EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
  EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
  EXECUTE format('CREATE INDEX %1$s_i2 ON pgboss.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);
  EXECUTE format('CREATE INDEX %1$s_i3 ON pgboss.%1$I (name) INCLUDE (priority, created_on, id) WHERE state = ''created'' AND policy = ''singleton''', table_name);

  EXECUTE format('ALTER TABLE pgboss.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
  EXECUTE format('ALTER TABLE pgboss.job ATTACH PARTITION pgboss.%I FOR VALUES IN (%L)', table_name, queue_name);
END;
$$
LANGUAGE plpgsql;

-- Create delete queue function
CREATE OR REPLACE FUNCTION pgboss.delete_queue(queue_name text)
RETURNS VOID AS
$$
DECLARE
  table_name varchar;
BEGIN
  SELECT partition_name into table_name from pgboss.queue where name = queue_name;

  IF table_name IS NOT NULL THEN
    EXECUTE format('DROP TABLE pgboss.%I', table_name);
  END IF;

  DELETE FROM pgboss.queue where name = queue_name;
END;
$$
LANGUAGE plpgsql;

-- Insert current schema version
INSERT INTO pgboss.version (version) VALUES (24);

-- Change ownership of all pg-boss objects to worker role
-- This allows the worker to manage partitions and perform all pg-boss operations
-- Note: We need to temporarily grant worker role to postgres to allow ownership changes
GRANT worker TO postgres;

ALTER SCHEMA pgboss OWNER TO worker;
ALTER TYPE pgboss.job_state OWNER TO worker;
ALTER TABLE pgboss.version OWNER TO worker;
ALTER TABLE pgboss.queue OWNER TO worker;
ALTER TABLE pgboss.schedule OWNER TO worker;
ALTER TABLE pgboss.subscription OWNER TO worker;
ALTER TABLE pgboss.job OWNER TO worker;
ALTER TABLE pgboss.archive OWNER TO worker;
ALTER FUNCTION pgboss.create_queue(text, json) OWNER TO worker;
ALTER FUNCTION pgboss.delete_queue(text) OWNER TO worker;

-- Revoke worker role from postgres for security
REVOKE worker FROM postgres;

-- Ensure worker has all necessary permissions on the schema
GRANT USAGE, CREATE ON SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pgboss TO worker;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA pgboss TO worker;
GRANT USAGE ON TYPE pgboss.job_state TO worker;
