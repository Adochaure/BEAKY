alter table public.user_profiles
  add column if not exists candidate_profile jsonb,
  add column if not exists candidate_profile_updated_at timestamptz;
