create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  resume_path text,
  resume_name text,
  gmail_notifications boolean not null default true,
  custom_apis_enabled boolean not null default false,
  gemini_api_key_ciphertext text,
  groq_api_key_ciphertext text,
  nvidia_api_key_ciphertext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
revoke all on table public.user_profiles from anon, authenticated;
grant select, insert, update on table public.user_profiles to authenticated;

drop policy if exists "Users can read their profile" on public.user_profiles;
drop policy if exists "Users can create their profile" on public.user_profiles;
drop policy if exists "Users can update their profile" on public.user_profiles;
create policy "Users can read their profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['application/pdf'];

drop policy if exists "Users can read their resume files" on storage.objects;
drop policy if exists "Users can upload their resume files" on storage.objects;
drop policy if exists "Users can replace their resume files" on storage.objects;
drop policy if exists "Users can delete their resume files" on storage.objects;
create policy "Users can read their resume files"
  on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can upload their resume files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can replace their resume files"
  on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete their resume files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
