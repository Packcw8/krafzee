alter table public.listings
add column if not exists requires_shipping boolean not null default true,
add column if not exists free_shipping boolean not null default false,
add column if not exists weight numeric(10, 2),
add column if not exists weight_unit text not null default 'oz',
add column if not exists package_length numeric(10, 2),
add column if not exists package_width numeric(10, 2),
add column if not exists package_height numeric(10, 2),
add column if not exists dimension_unit text not null default 'in',
add column if not exists shipping_profile_id uuid,
add column if not exists handling_time_min_days integer,
add column if not exists handling_time_max_days integer;

alter table public.orders
add column if not exists shipping_amount integer not null default 0,
add column if not exists shipping_service_fee_amount integer not null default 0,
add column if not exists shipping_postage_amount integer not null default 0,
add column if not exists seller_shipping_responsibility_amount integer not null default 0,
add column if not exists shipping_quote_id uuid,
add column if not exists shipping_address jsonb not null default '{}'::jsonb;

alter table public.order_items
add column if not exists requires_shipping boolean not null default true,
add column if not exists free_shipping boolean not null default false,
add column if not exists shipping_responsibility_amount integer not null default 0;

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('krafzee_shipping_service_fee_cents', '35'::jsonb)
on conflict (key) do nothing;

create table if not exists public.seller_shipping_settings (
  id uuid primary key default gen_random_uuid(),
  booth_id uuid not null unique references public.booths(id) on delete cascade,
  ship_from_name text,
  ship_from_street1 text,
  ship_from_street2 text,
  ship_from_city text,
  ship_from_state text,
  ship_from_zip text,
  ship_from_country text not null default 'US',
  ship_from_phone text,
  ship_from_email text,
  address_validation_status text not null default 'unvalidated',
  address_validation_message text,
  default_package_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_packages (
  id uuid primary key default gen_random_uuid(),
  booth_id uuid not null references public.booths(id) on delete cascade,
  name text not null,
  length numeric(10, 2) not null,
  width numeric(10, 2) not null,
  height numeric(10, 2) not null,
  dimension_unit text not null default 'in',
  empty_weight numeric(10, 2) not null default 0,
  weight_unit text not null default 'oz',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_shipping_settings
drop constraint if exists seller_shipping_settings_default_package_id_fkey;

alter table public.seller_shipping_settings
add constraint seller_shipping_settings_default_package_id_fkey
foreign key (default_package_id) references public.seller_packages(id) on delete set null;

create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  currency text not null default 'usd',
  destination_address jsonb not null,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_quote_groups (
  id uuid primary key default gen_random_uuid(),
  shipping_quote_id uuid not null references public.shipping_quotes(id) on delete cascade,
  booth_id uuid not null references public.booths(id) on delete cascade,
  seller_paid boolean not null default false,
  total_weight numeric(10, 2),
  weight_unit text not null default 'oz',
  package_length numeric(10, 2),
  package_width numeric(10, 2),
  package_height numeric(10, 2),
  dimension_unit text not null default 'in',
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  shipping_quote_id uuid not null references public.shipping_quotes(id) on delete cascade,
  shipping_quote_group_id uuid not null references public.shipping_quote_groups(id) on delete cascade,
  provider text not null default 'shippo',
  provider_rate_id text not null,
  carrier text not null,
  service text not null,
  amount integer not null default 0,
  currency text not null default 'usd',
  estimated_days integer,
  seller_id uuid references auth.users(id) on delete set null,
  booth_id uuid not null references public.booths(id) on delete cascade,
  carrier_postage_cost integer not null default 0,
  shipping_api_cost integer not null default 0,
  krafzee_shipping_fee integer not null default 0,
  customer_shipping_charge integer not null default 0,
  seller_shipping_responsibility integer not null default 0,
  total_shipping_cost integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (shipping_quote_id, provider_rate_id)
);

create table if not exists public.order_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  booth_id uuid not null references public.booths(id) on delete cascade,
  status text not null default 'pending',
  selected_shipping_rate_id uuid references public.shipping_rates(id) on delete set null,
  buyer_shipping_charge integer not null default 0,
  carrier_postage_cost integer not null default 0,
  shipping_api_cost integer not null default 0,
  krafzee_shipping_fee integer not null default 0,
  seller_shipping_responsibility integer not null default 0,
  total_shipping_cost integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, booth_id)
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_fulfillment_id uuid not null references public.order_fulfillments(id) on delete cascade,
  provider text not null default 'shippo',
  status text not null default 'pending',
  ship_from_address jsonb not null default '{}'::jsonb,
  ship_to_address jsonb not null default '{}'::jsonb,
  package jsonb not null default '{}'::jsonb,
  selected_shipping_rate_id uuid references public.shipping_rates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique (shipment_id, order_item_id)
);

create table if not exists public.shipping_labels (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references public.shipments(id) on delete cascade,
  provider text not null default 'shippo',
  provider_transaction_id text unique,
  provider_rate_id text,
  carrier text,
  service text,
  label_url text,
  label_file_url text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending',
  postage_amount integer not null default 0,
  krafzee_shipping_fee integer not null default 0,
  is_test boolean not null default false,
  idempotency_key text unique,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  shipping_label_id uuid references public.shipping_labels(id) on delete cascade,
  provider text not null default 'shippo',
  provider_event_id text,
  normalized_status text not null default 'unknown',
  provider_status text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists seller_packages_booth_id_idx on public.seller_packages (booth_id);
create index if not exists shipping_quotes_buyer_id_idx on public.shipping_quotes (buyer_id);
create index if not exists shipping_rates_quote_id_idx on public.shipping_rates (shipping_quote_id);
create index if not exists shipping_rates_booth_id_idx on public.shipping_rates (booth_id);
create index if not exists order_fulfillments_order_id_idx on public.order_fulfillments (order_id);
create index if not exists order_fulfillments_booth_id_idx on public.order_fulfillments (booth_id);
create index if not exists shipments_fulfillment_id_idx on public.shipments (order_fulfillment_id);
create index if not exists shipping_labels_tracking_number_idx on public.shipping_labels (tracking_number);

alter table public.seller_shipping_settings enable row level security;
alter table public.seller_packages enable row level security;
alter table public.shipping_quotes enable row level security;
alter table public.shipping_quote_groups enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.order_fulfillments enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.shipping_labels enable row level security;
alter table public.shipping_events enable row level security;

drop policy if exists "Sellers manage own shipping settings" on public.seller_shipping_settings;
create policy "Sellers manage own shipping settings"
on public.seller_shipping_settings
for all
to authenticated
using (exists (select 1 from public.booths where booths.id = seller_shipping_settings.booth_id and booths.owner_id = auth.uid()))
with check (exists (select 1 from public.booths where booths.id = seller_shipping_settings.booth_id and booths.owner_id = auth.uid()));

drop policy if exists "Sellers manage own packages" on public.seller_packages;
create policy "Sellers manage own packages"
on public.seller_packages
for all
to authenticated
using (exists (select 1 from public.booths where booths.id = seller_packages.booth_id and booths.owner_id = auth.uid()))
with check (exists (select 1 from public.booths where booths.id = seller_packages.booth_id and booths.owner_id = auth.uid()));

drop policy if exists "Buyers read own shipping quotes" on public.shipping_quotes;
create policy "Buyers read own shipping quotes"
on public.shipping_quotes
for select
to authenticated
using (buyer_id = auth.uid());

drop policy if exists "Buyers read own quote groups" on public.shipping_quote_groups;
create policy "Buyers read own quote groups"
on public.shipping_quote_groups
for select
to authenticated
using (exists (select 1 from public.shipping_quotes where shipping_quotes.id = shipping_quote_groups.shipping_quote_id and shipping_quotes.buyer_id = auth.uid()));

drop policy if exists "Buyers read own shipping rates" on public.shipping_rates;
create policy "Buyers read own shipping rates"
on public.shipping_rates
for select
to authenticated
using (exists (select 1 from public.shipping_quotes where shipping_quotes.id = shipping_rates.shipping_quote_id and shipping_quotes.buyer_id = auth.uid()));

drop policy if exists "Sellers read own order items" on public.order_items;
create policy "Sellers read own order items"
on public.order_items
for select
to authenticated
using (exists (select 1 from public.booths where booths.id = order_items.booth_id and booths.owner_id = auth.uid()));

drop policy if exists "Sellers read orders with own items" on public.orders;
create policy "Sellers read orders with own items"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.order_items
    join public.booths on booths.id = order_items.booth_id
    where order_items.order_id = orders.id
      and booths.owner_id = auth.uid()
  )
);

drop policy if exists "Buyers read own fulfillments" on public.order_fulfillments;
create policy "Buyers read own fulfillments"
on public.order_fulfillments
for select
to authenticated
using (exists (select 1 from public.orders where orders.id = order_fulfillments.order_id and orders.buyer_id = auth.uid()));

drop policy if exists "Sellers read own fulfillments" on public.order_fulfillments;
create policy "Sellers read own fulfillments"
on public.order_fulfillments
for select
to authenticated
using (exists (select 1 from public.booths where booths.id = order_fulfillments.booth_id and booths.owner_id = auth.uid()));

drop policy if exists "Buyers read own shipments" on public.shipments;
create policy "Buyers read own shipments"
on public.shipments
for select
to authenticated
using (
  exists (
    select 1
    from public.order_fulfillments
    join public.orders on orders.id = order_fulfillments.order_id
    where order_fulfillments.id = shipments.order_fulfillment_id
      and orders.buyer_id = auth.uid()
  )
);

drop policy if exists "Sellers read own shipments" on public.shipments;
create policy "Sellers read own shipments"
on public.shipments
for select
to authenticated
using (
  exists (
    select 1
    from public.order_fulfillments
    join public.booths on booths.id = order_fulfillments.booth_id
    where order_fulfillments.id = shipments.order_fulfillment_id
      and booths.owner_id = auth.uid()
  )
);

drop policy if exists "Buyers read own labels" on public.shipping_labels;
create policy "Buyers read own labels"
on public.shipping_labels
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments
    join public.order_fulfillments on order_fulfillments.id = shipments.order_fulfillment_id
    join public.orders on orders.id = order_fulfillments.order_id
    where shipments.id = shipping_labels.shipment_id
      and orders.buyer_id = auth.uid()
  )
);

drop policy if exists "Sellers read own labels" on public.shipping_labels;
create policy "Sellers read own labels"
on public.shipping_labels
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments
    join public.order_fulfillments on order_fulfillments.id = shipments.order_fulfillment_id
    join public.booths on booths.id = order_fulfillments.booth_id
    where shipments.id = shipping_labels.shipment_id
      and booths.owner_id = auth.uid()
  )
);
