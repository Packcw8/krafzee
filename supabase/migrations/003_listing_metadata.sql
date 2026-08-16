alter table public.listings
add column if not exists item_type text,
add column if not exists attributes jsonb not null default '{}'::jsonb,
add column if not exists variants jsonb not null default '[]'::jsonb,
add column if not exists quantity integer not null default 1,
add column if not exists processing_time text,
add column if not exists materials text[] not null default '{}';

alter table public.listings
drop constraint if exists listings_quantity_positive;

alter table public.listings
add constraint listings_quantity_positive
check (quantity >= 0);

create index if not exists listings_attributes_idx
on public.listings using gin (attributes);

create index if not exists listings_variants_idx
on public.listings using gin (variants);

create index if not exists listings_category_idx
on public.listings (category);
