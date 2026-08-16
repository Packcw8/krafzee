alter table public.booths
add column if not exists stripe_account_id text,
add column if not exists stripe_onboarding_complete boolean not null default false,
add column if not exists stripe_charges_enabled boolean not null default false,
add column if not exists stripe_payouts_enabled boolean not null default false,
add column if not exists stripe_requirements jsonb not null default '{}'::jsonb;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id) on delete set null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending',
  currency text not null default 'usd',
  subtotal_amount integer not null default 0,
  platform_fee_amount integer not null default 0,
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  booth_id uuid references public.booths(id) on delete set null,
  stripe_account_id text not null,
  title text not null,
  selected_option text,
  quantity integer not null default 1,
  unit_amount integer not null,
  total_amount integer not null,
  platform_fee_amount integer not null default 0,
  seller_amount integer not null default 0,
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_booth_id_idx on public.order_items (booth_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Buyers can read own orders" on public.orders;
drop policy if exists "Buyers can read own order items" on public.order_items;

create policy "Buyers can read own orders"
on public.orders
for select
to authenticated
using (buyer_id = auth.uid());

create policy "Buyers can read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
  )
);
