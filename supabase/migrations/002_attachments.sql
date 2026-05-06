-- Procurement Dashboard — attachments support.
--
-- Adds an `attachments` JSONB column to `tasks` and `tenders` (mirrors the
-- existing `work_logs` shape contract: a list of small metadata objects
-- maintained client-side) and a private Supabase Storage bucket where the
-- actual file blobs live. Files are keyed by
--   <user_id>/<kind>/<item_id>/<file_id>-<filename>
-- so the leading path segment can be used as the RLS owner check, exactly
-- like Supabase's recommended pattern for per-user storage.
--
-- Each attachments[] entry has the shape:
--   { id, name, size, mimeType, path, uploadedAt }

set search_path = public;

-- ─── Schema additions ───────────────────────────────────────────
alter table tasks
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table tenders
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- ─── Storage bucket ─────────────────────────────────────────────
-- Private bucket — clients must use signed URLs (or authenticated
-- downloads) to fetch a file. RLS policies below scope every operation
-- to the owning user via the leading path segment.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Per-user RLS on storage.objects. The first folder segment of `name`
-- must equal auth.uid()::text — that's how we attribute every blob.
drop policy if exists "attachments read own" on storage.objects;
create policy "attachments read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments insert own" on storage.objects;
create policy "attachments insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments update own" on storage.objects;
create policy "attachments update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments delete own" on storage.objects;
create policy "attachments delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
