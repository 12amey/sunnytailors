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

-- Append-only per-customer activity: measurement snapshots, design saves and optional payments.
create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  event_type text not null check (event_type in ('measurement_created', 'measurement_updated', 'payment', 'design_saved', 'order_created', 'order_updated')),
  title text not null default '',
  amount numeric(12, 2),
  notes text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint customer_events_payment_amount_check check (event_type <> 'payment' or amount > 0)
);

alter table public.customer_events drop constraint if exists customer_events_event_type_check;
alter table public.customer_events add constraint customer_events_event_type_check
  check (event_type in ('measurement_created', 'measurement_updated', 'payment', 'design_saved', 'order_created', 'order_updated'));

create index if not exists customer_events_customer_date_idx on public.customer_events (customer_id, created_at desc);

alter table public.customer_events enable row level security;

drop policy if exists "Public can read customer activity" on public.customer_events;
create policy "Public can read customer activity"
  on public.customer_events for select to anon using (true);

drop policy if exists "Public can add customer activity" on public.customer_events;
create policy "Public can add customer activity"
  on public.customer_events for insert to anon with check (true);

grant select, insert on public.customer_events to anon;

-- Tailoring bills/orders are attached to a customer and keep a measurement snapshot for that job.
create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_number text not null unique,
  garment_type text not null default '',
  description text not null default '',
  total_amount numeric(12, 2) not null check (total_amount > 0),
  advance_amount numeric(12, 2) not null default 0 check (advance_amount >= 0 and advance_amount <= total_amount),
  advance_method text not null default 'cash' check (advance_method in ('cash', 'upi', 'other')),
  due_date text not null default '',
  status text not null default 'new' check (status in ('new', 'in_progress', 'ready', 'delivered', 'cancelled')),
  notes text not null default '',
  measurements jsonb not null default '{}'::jsonb,
  measurement_date text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_orders_customer_date_idx on public.customer_orders (customer_id, created_at desc);
alter table public.customer_orders enable row level security;

drop policy if exists "Public can read customer orders" on public.customer_orders;
create policy "Public can read customer orders" on public.customer_orders for select to anon using (true);
drop policy if exists "Public can create customer orders" on public.customer_orders;
create policy "Public can create customer orders" on public.customer_orders for insert to anon with check (true);
drop policy if exists "Public can update customer orders" on public.customer_orders;
create policy "Public can update customer orders" on public.customer_orders for update to anon using (true) with check (true);
drop policy if exists "Public can delete customer orders" on public.customer_orders;
create policy "Public can delete customer orders" on public.customer_orders for delete to anon using (true);
grant select, insert, update, delete on public.customer_orders to anon;

create table if not exists public.customer_order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.customer_orders(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'cash' check (method in ('cash', 'upi', 'other')),
  stage text not null default 'part' check (stage in ('advance', 'part', 'final')),
  notes text not null default '',
  payment_date text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists customer_order_payments_order_date_idx on public.customer_order_payments (order_id, created_at desc);
alter table public.customer_order_payments enable row level security;

drop policy if exists "Public can read order payments" on public.customer_order_payments;
create policy "Public can read order payments" on public.customer_order_payments for select to anon using (true);
drop policy if exists "Public can add order payments" on public.customer_order_payments;
create policy "Public can add order payments" on public.customer_order_payments for insert to anon with check (true);
grant select, insert on public.customer_order_payments to anon;

-- Seed an initial history snapshot for customer records that predate this activity log.
insert into public.customer_events (customer_id, event_type, title, amount, notes, details, created_at)
select c.id, 'measurement_created', 'Customer record imported', null, c.measurement_notes,
  jsonb_build_object('garment_type', c.garment_type, 'measurements', c.measurements, 'measurement_date', c.measurement_date), c.created_at
from public.customers c
where not exists (
  select 1 from public.customer_events e
  where e.customer_id = c.id and e.event_type in ('measurement_created', 'measurement_updated')
);
