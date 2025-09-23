-- Drop legacy pg-boss schema and worker role now that Trigger.dev owns job orchestration.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgboss'
  ) THEN
    -- Revoke default privileges that referenced the pg-boss schema before dropping it.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'worker') THEN
      BEGIN
        EXECUTE 'alter default privileges in schema pgboss revoke all on tables from worker';
        EXECUTE 'alter default privileges in schema pgboss revoke all on sequences from worker';
        EXECUTE 'alter default privileges in schema pgboss revoke all on functions from worker';
      EXCEPTION
        WHEN undefined_schema THEN NULL;
      END;
    END IF;

    BEGIN
      EXECUTE 'revoke all privileges on schema pgboss from public';
    EXCEPTION WHEN undefined_schema THEN NULL;
    END;

    BEGIN
      EXECUTE 'revoke all privileges on schema pgboss from worker';
    EXCEPTION WHEN undefined_schema OR undefined_table THEN NULL;
    END;
  END IF;
END$$;

DROP SCHEMA IF EXISTS pgboss CASCADE;

DROP TABLE IF EXISTS public.job_metrics CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'worker') THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM worker;
    REVOKE ALL PRIVILEGES ON DATABASE current_database() FROM worker;
    DROP ROLE worker;
  END IF;
END$$;
