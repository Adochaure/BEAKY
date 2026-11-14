create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  company text not null check (char_length(company) between 1 and 200),
  location text,
  opportunity_type text not null default 'Job'
    check (opportunity_type in ('Job', 'Internship', 'Fellowship')),
  job_url text,
  description text,
  status text not null default 'Saved'
    check (status in ('Saved', 'Outreach', 'Replied', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_user_created_at_idx
  on public.opportunities (user_id, created_at desc);

alter table public.opportunities enable row level security;
revoke all on table public.opportunities from anon, authenticated;
grant select, insert, update, delete on table public.opportunities to authenticated;

drop policy if exists "Users can read their opportunities" on public.opportunities;
drop policy if exists "Users can create their opportunities" on public.opportunities;
drop policy if exists "Users can update their opportunities" on public.opportunities;
drop policy if exists "Users can delete their opportunities" on public.opportunities;
create policy "Users can read their opportunities"
  on public.opportunities for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their opportunities"
  on public.opportunities for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their opportunities"
  on public.opportunities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their opportunities"
  on public.opportunities for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.recruiter_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  title text not null default '',
  company text not null check (char_length(company) between 1 and 200),
  email text not null check (char_length(email) between 3 and 254),
  domain text not null check (char_length(domain) between 1 and 253),
  domain_status text not null
    check (domain_status in ('mx_found', 'no_mx', 'invalid_domain', 'check_failed')),
  check_message text not null default '',
  checked_at timestamptz not null default now(),
  do_not_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruiter_contacts_user_created_at_idx
  on public.recruiter_contacts (user_id, created_at desc);
create index if not exists recruiter_contacts_user_email_idx
  on public.recruiter_contacts (user_id, lower(email));

alter table public.recruiter_contacts enable row level security;
revoke all on table public.recruiter_contacts from anon, authenticated;
grant select, insert, update, delete on table public.recruiter_contacts to authenticated;

drop policy if exists "Users can read their recruiter contacts" on public.recruiter_contacts;
drop policy if exists "Users can create their recruiter contacts" on public.recruiter_contacts;
drop policy if exists "Users can update their recruiter contacts" on public.recruiter_contacts;
drop policy if exists "Users can delete their recruiter contacts" on public.recruiter_contacts;
create policy "Users can read their recruiter contacts"
  on public.recruiter_contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their recruiter contacts"
  on public.recruiter_contacts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their recruiter contacts"
  on public.recruiter_contacts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their recruiter contacts"
  on public.recruiter_contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.discovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid references public.recruiter_contacts (id) on delete set null,
  step text not null check (char_length(step) between 1 and 80),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discovery_logs_user_created_at_idx
  on public.discovery_logs (user_id, created_at desc);

alter table public.discovery_logs enable row level security;
revoke all on table public.discovery_logs from anon, authenticated;
grant select, insert on table public.discovery_logs to authenticated;

drop policy if exists "Users can read their discovery logs" on public.discovery_logs;
drop policy if exists "Users can create their discovery logs" on public.discovery_logs;
create policy "Users can read their discovery logs"
  on public.discovery_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their discovery logs"
  on public.discovery_logs for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      contact_id is null
      or exists (
        select 1
        from public.recruiter_contacts as contact
        where contact.id = contact_id
          and contact.user_id = (select auth.uid())
      )
    )
  );
