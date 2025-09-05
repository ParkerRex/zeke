create role worker login password '36fcf077ca100d32194e58a762265e4cd4ece41b3e5ffb30343d526048c0741';
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
