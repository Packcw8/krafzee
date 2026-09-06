alter table public.listings add column if not exists image_urls text[] not null default '{}';

create table if not exists public.listing_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.listing_drafts enable row level security;
grant select, insert, update, delete on public.listing_drafts to authenticated;
revoke all on public.listing_drafts from anon;
drop policy if exists "Owners manage listing drafts" on public.listing_drafts;
create policy "Owners manage listing drafts" on public.listing_drafts
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
