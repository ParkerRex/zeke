create role worker login password 'YOUR_SECURE_PASSWORD';
grant connect on database postgres to worker;
grant create on database postgres to worker; -- needed for CREATE SCHEMA IF NOT EXISTS
grant usage on schema public to worker;

-- pg-boss schema (create as admin; let worker create objects in it)
create schema if not exists pgboss;
grant usage, create on schema pgboss to worker;

-- app tables (adjust later as needed)
grant select, insert, update, delete on all tables in schema public to worker;
grant usage on all sequences in schema public to worker;
alter default privileges in schema public grant select, insert, update, delete on tables to worker;
alter default privileges in schema public grant usage on sequences to worker;
