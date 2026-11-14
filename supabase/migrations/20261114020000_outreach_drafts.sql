create table if not exists public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_guid text not null,
  job_title text not null check (char_length(job_title) between 1 and 200),
  company text not null check (char_length(company) between 1 and 200),
  application_link text not null,
  recruiter_name text not null default '',
  recruiter_email text not null check (char_length(recruiter_email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 15000),
  status text not null default 'draft' check (status in ('draft', 'approved', 'sending', 'sent')),
  gmail_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz
);

create index if not exists outreach_drafts_user_created_at_idx
  on public.outreach_drafts (user_id, created_at desc);
create index if not exists outreach_drafts_user_status_idx
  on public.outreach_drafts (user_id, status);

alter table public.outreach_drafts enable row level security;
revoke all on table public.outreach_drafts from anon, authenticated;
grant select, insert, update on table public.outreach_drafts to authenticated;

drop policy if exists "Users can read their outreach drafts" on public.outreach_drafts;
drop policy if exists "Users can create their outreach drafts" on public.outreach_drafts;
drop policy if exists "Users can update their outreach drafts" on public.outreach_drafts;
create policy "Users can read their outreach drafts"
  on public.outreach_drafts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their outreach drafts"
  on public.outreach_drafts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their outreach drafts"
  on public.outreach_drafts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
