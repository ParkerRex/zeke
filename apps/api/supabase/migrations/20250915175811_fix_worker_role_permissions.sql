
-- Grant necessary permissions for worker operations on existing tables
grant select, insert, update, delete on all tables in schema public to worker;
grant usage, select on all sequences in schema public to worker;

-- Grant permissions on future tables and sequences in public schema
alter default privileges in schema public grant select, insert, update, delete on tables to worker;
alter default privileges in schema public grant usage, select on sequences to worker;

-- Grant pgboss schema permissions (create schema if it doesn't exist)
-- NOTE: Warnings about "no privileges were granted" for pgboss tables are expected
-- during migration time since pgboss tables don't exist yet. The default privileges
-- below will apply when pgboss creates its tables at runtime.
create schema if not exists pgboss;
grant usage on schema pgboss to worker;
alter default privileges in schema pgboss grant select, insert, update, delete on tables to worker;
alter default privileges in schema pgboss grant usage, select on sequences to worker;

-- Ensure worker can connect to the database
grant connect on database postgres to worker;
