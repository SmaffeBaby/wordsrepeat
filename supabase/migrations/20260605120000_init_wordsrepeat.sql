create extension if not exists "pgcrypto";

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  color text not null default '#2f8f6b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  value text not null check (char_length(value) between 1 and 3000),
  hint text check (hint is null or char_length(hint) <= 500),
  image_url text,
  interval_minutes integer not null default 60 check (interval_minutes in (5, 10, 20, 60, 180, 360, 720, 1440, 4320, 10080)),
  due_at timestamptz not null default now(),
  deck_position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  result text not null check (result in ('again', 'done')),
  interval_minutes integer,
  reviewed_at timestamptz not null default now()
);

create index categories_user_created_idx on public.categories(user_id, created_at desc);
create index cards_user_due_idx on public.cards(user_id, due_at asc, deck_position asc);
create index cards_category_idx on public.cards(category_id, created_at desc);
create index review_logs_user_reviewed_idx on public.review_logs(user_id, reviewed_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_touch_updated_at
before update on public.categories
for each row execute function public.touch_updated_at();

create trigger cards_touch_updated_at
before update on public.cards
for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;
alter table public.cards enable row level security;
alter table public.review_logs enable row level security;

create policy "users manage their categories"
on public.categories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage their cards"
on public.cards
for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.categories
    where categories.id = cards.category_id
      and categories.user_id = auth.uid()
  )
);

create policy "users read their review logs"
on public.review_logs
for select
using (auth.uid() = user_id);

create policy "users insert their review logs"
on public.review_logs
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.cards
    where cards.id = review_logs.card_id
      and cards.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-images',
  'card-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload card images"
on storage.objects
for insert
with check (
  bucket_id = 'card-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users update card images"
on storage.objects
for update
using (
  bucket_id = 'card-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'card-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users delete card images"
on storage.objects
for delete
using (
  bucket_id = 'card-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "public reads card images"
on storage.objects
for select
using (bucket_id = 'card-images');
