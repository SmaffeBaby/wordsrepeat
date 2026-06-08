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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'users upload card images'
  ) then
    create policy "users upload card images"
    on storage.objects
    for insert
    with check (
      bucket_id = 'card-images'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'users update card images'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'users delete card images'
  ) then
    create policy "users delete card images"
    on storage.objects
    for delete
    using (
      bucket_id = 'card-images'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public reads card images'
  ) then
    create policy "public reads card images"
    on storage.objects
    for select
    using (bucket_id = 'card-images');
  end if;
end $$;
