alter table public.cards
add column if not exists difficulty integer not null default 1 check (difficulty between 1 and 5);

alter table public.cards
add column if not exists completed_at timestamptz;

create index if not exists cards_completed_idx
on public.cards(user_id, completed_at desc)
where completed_at is not null;
