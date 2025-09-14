-- Fix security warnings by setting search_path for trigger functions
create or replace function locations_search_tsv_trigger() returns trigger language plpgsql
set search_path = public as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.address_line1,'') || ' ' || coalesce(new.city,'') || ' ' || coalesce(new.state,'')));
  return new;
end; $$;

create or replace function machines_search_tsv_trigger() returns trigger language plpgsql
set search_path = public as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.location,'') || ' ' || coalesce(new.status,'')));
  return new;
end; $$;

create or replace function products_search_tsv_trigger() returns trigger language plpgsql
set search_path = public as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.sku,'') || ' ' || coalesce(new.name,'') || ' ' || coalesce(new.category,'') || ' ' || coalesce(new.manufacturer,'')));
  return new;
end; $$;

create or replace function suppliers_search_tsv_trigger() returns trigger language plpgsql
set search_path = public as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.name,'') || ' ' || coalesce(new.contact,'')));
  return new;
end; $$;

create or replace function staff_search_tsv_trigger() returns trigger language plpgsql
set search_path = public as $$
begin
  new.search_tsv := to_tsvector('simple', unaccent(coalesce(new.full_name,'') || ' ' || coalesce(new.email,'') || ' ' || coalesce(new.role,'')));
  return new;
end; $$;