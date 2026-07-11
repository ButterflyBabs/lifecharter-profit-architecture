-- Migration: 002_tpa_profiles.sql
-- Phase 1: Foundation - Extended user profiles

-- Profiles table: Extended user information linked to auth.users
create table if not exists public.tpa_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  timezone text not null default 'America/Denver',
  phone text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists tpa_profiles_email_idx on public.tpa_profiles(email);

-- Trigger for updated_at
create trigger tpa_profiles_updated_at
  before update on public.tpa_profiles
  for each row
  execute function public.tpa_update_updated_at_column();

-- Enable RLS
alter table public.tpa_profiles enable row level security;

-- RLS Policies
-- Users can view their own profile
create policy "profiles_self_select"
  on public.tpa_profiles
  for select
  using (id = auth.uid());

-- Users can update their own profile
create policy "profiles_self_update"
  on public.tpa_profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users can insert their own profile (on signup)
create policy "profiles_self_insert"
  on public.tpa_profiles
  for insert
  with check (id = auth.uid());

-- Facilitators and admins can view profiles in their tenant
create policy "facilitators_can_view_tenant_profiles"
  on public.tpa_profiles
  for select
  using (
    exists (
      select 1 from public.tpa_tenant_memberships tm
      where tm.user_id = auth.uid()
        and tm.role in ('facilitator', 'senior_reviewer', 'organization_admin', 'white_label_admin', 'system_admin')
        and tm.status = 'active'
        and exists (
          select 1 from public.tpa_tenant_memberships tm2
          where tm2.user_id = tpa_profiles.id
            and tm2.tenant_id = tm.tenant_id
            and tm2.status = 'active'
        )
    )
  );

comment on table public.tpa_profiles is 'Extended user profiles linked to Supabase Auth';
comment on column public.tpa_profiles.preferences is 'JSONB user preferences including pace selection';
