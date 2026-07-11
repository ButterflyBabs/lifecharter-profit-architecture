-- Migration: 008_tpa_pace_settings.sql
-- Phase 1: Foundation - User pace preferences

-- Pace settings table: Store user pace preferences
create table if not exists public.tpa_pace_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.tpa_profiles(id) on delete cascade,
  pace text not null default 'standard' check (pace in ('aggressive', 'standard', 'conservative')),
  effective_date timestamptz not null default now(),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Trigger for updated_at
create trigger tpa_pace_settings_updated_at
  before update on public.tpa_pace_settings
  for each row
  execute function public.tpa_update_updated_at_column();

-- Enable RLS
alter table public.tpa_pace_settings enable row level security;

-- RLS Policies
-- Users can view and manage their own pace settings
create policy "users_can_view_own_pace"
  on public.tpa_pace_settings
  for select
  using (user_id = auth.uid());

create policy "users_can_update_own_pace"
  on public.tpa_pace_settings
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_can_insert_own_pace"
  on public.tpa_pace_settings
  for insert
  with check (user_id = auth.uid());

-- Function to get user's current pace
create or replace function public.tpa_get_user_pace(p_user_id uuid)
returns text language sql stable as $$
  select coalesce(
    (select pace from public.tpa_pace_settings where user_id = p_user_id),
    'standard'
  );
$$;

-- Function to set default pace on profile creation
create or replace function public.tpa_create_default_pace_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.tpa_pace_settings (user_id, pace)
  values (new.id, 'standard');
  return new;
end;
$$;

create trigger tpa_profile_default_pace
  after insert on public.tpa_profiles
  for each row
  execute function public.tpa_create_default_pace_settings();

comment on table public.tpa_pace_settings is 'User pace preferences for build timeline';
comment on column public.tpa_pace_settings.pace is 'aggressive (16w), standard (20w), or conservative (25w)';
