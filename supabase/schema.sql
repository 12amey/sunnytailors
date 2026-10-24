-- Sunny Tailor customer records.
-- These policies intentionally allow unauthenticated public access, as requested.
-- Anyone with the project URL and publishable key can read, create, edit, and delete records.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  notes text not null default '',
  garment_type text not null default '',
  measurements jsonb not null default '{}'::jsonb,
  measurement_notes text not null default '',
  measurement_date text not null default '',
  design_image text not null default '',
  import_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency key used for direct batch imports so retrying a page cannot duplicate its records.
alter table public.customers add column if not exists import_key text;
alter table public.customers add column if not exists measurement_date text not null default '';
alter table public.customers add column if not exists design_image text not null default '';
create unique index if not exists customers_import_key_uidx on public.customers (import_key);

create index if not exists customers_name_idx on public.customers (name);
create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;

drop policy if exists "Public can read customer records" on public.customers;
create policy "Public can read customer records"
  on public.customers for select to anon using (true);

drop policy if exists "Public can create customer records" on public.customers;
create policy "Public can create customer records"
  on public.customers for insert to anon with check (true);

drop policy if exists "Public can update customer records" on public.customers;
create policy "Public can update customer records"
  on public.customers for update to anon using (true) with check (true);

drop policy if exists "Public can delete customer records" on public.customers;
create policy "Public can delete customer records"
  on public.customers for delete to anon using (true);

grant select, insert, update, delete on public.customers to anon;
