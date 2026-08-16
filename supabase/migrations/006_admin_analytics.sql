alter table public.booths
add column if not exists is_verified boolean not null default false,
add column if not exists verified_at timestamptz,
add column if not exists verified_by uuid references auth.users(id) on delete set null,
add column if not exists admin_notes text,
add column if not exists is_hidden boolean not null default false,
add column if not exists view_count integer not null default 0,
add column if not exists last_viewed_at timestamptz;

alter table public.listings
add column if not exists is_verified boolean not null default false,
add column if not exists verified_at timestamptz,
add column if not exists verified_by uuid references auth.users(id) on delete set null,
add column if not exists admin_notes text,
add column if not exists is_hidden boolean not null default false,
add column if not exists view_count integer not null default 0,
add column if not exists last_viewed_at timestamptz;

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  booth_id uuid references public.booths(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  session_key text,
  source text,
  user_agent text,
  viewed_at timestamptz not null default now()
);

create index if not exists listing_views_listing_id_viewed_at_idx
on public.listing_views (listing_id, viewed_at desc);

create index if not exists listing_views_booth_id_viewed_at_idx
on public.listing_views (booth_id, viewed_at desc);

create index if not exists booths_verified_hidden_idx
on public.booths (is_verified, is_hidden);

create index if not exists listings_verified_hidden_idx
on public.listings (is_verified, is_hidden);

create index if not exists listings_view_count_idx
on public.listings (view_count desc);

drop policy if exists "Public can read booths" on public.booths;
drop policy if exists "Owners can read own booth" on public.booths;

create policy "Public can read visible booths"
on public.booths
for select
to public
using (is_hidden = false);

create policy "Owners can read own booth"
on public.booths
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Public can read listings" on public.listings;
drop policy if exists "Sellers can read own listings" on public.listings;

create policy "Public can read visible listings"
on public.listings
for select
to public
using (
  is_hidden = false
  and exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.is_hidden = false
  )
);

create policy "Sellers can read own listings"
on public.listings
for select
to authenticated
using (
  exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.owner_id = auth.uid()
  )
);

alter table public.listing_views enable row level security;

drop policy if exists "Sellers read own listing views" on public.listing_views;

create policy "Sellers read own listing views"
on public.listing_views
for select
to authenticated
using (
  exists (
    select 1
    from public.booths
    where booths.id = listing_views.booth_id
      and booths.owner_id = auth.uid()
  )
);

insert into public.profiles (id, display_name, role)
select
  users.id,
  coalesce(users.raw_user_meta_data->>'display_name', split_part(users.email, '@', 1), 'Brian'),
  'admin'
from auth.users
where lower(users.email) = 'brian@krafzee.com'
on conflict (id) do update
set role = 'admin';
