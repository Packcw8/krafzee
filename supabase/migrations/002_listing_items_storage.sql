insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'listing-images',
  'listing-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.listings enable row level security;

drop policy if exists "Public can read listings" on public.listings;
drop policy if exists "Sellers can create listings for own booth" on public.listings;
drop policy if exists "Sellers can update listings for own booth" on public.listings;
drop policy if exists "Sellers can delete listings for own booth" on public.listings;

create policy "Public can read listings"
on public.listings
for select
to public
using (true);

create policy "Sellers can create listings for own booth"
on public.listings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.owner_id = auth.uid()
  )
);

create policy "Sellers can update listings for own booth"
on public.listings
for update
to authenticated
using (
  exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.owner_id = auth.uid()
  )
);

create policy "Sellers can delete listings for own booth"
on public.listings
for delete
to authenticated
using (
  exists (
    select 1
    from public.booths
    where booths.id = listings.booth_id
      and booths.owner_id = auth.uid()
  )
);

drop policy if exists "Public can read listing images" on storage.objects;
drop policy if exists "Users can upload own listing images" on storage.objects;
drop policy if exists "Users can update own listing images" on storage.objects;
drop policy if exists "Users can delete own listing images" on storage.objects;

create policy "Public can read listing images"
on storage.objects
for select
to public
using (bucket_id = 'listing-images');

create policy "Users can upload own listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own listing images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
