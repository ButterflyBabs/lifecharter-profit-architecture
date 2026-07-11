-- Migration: 006_tpa_consent_records.sql
-- Phase 1: Foundation - Privacy and consent tracking

-- Consent records table: Track user consent and privacy acknowledgments
create table if not exists public.tpa_consent_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tpa_tenants(id) on delete cascade,
  user_id uuid not null references public.tpa_profiles(id) on delete cascade,
  consent_type text not null check (consent_type in (
    'privacy_policy',
    'terms_of_service',
    'data_processing',
    'marketing_communications',
    'ai_analysis',
    'third_party_sharing'
  )),
  policy_version text not null,
  granted boolean not null,
  ip_address inet,
  user_agent text,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- Indexes
create index if not exists tpa_consent_tenant_idx on public.tpa_consent_records(tenant_id);
create index if not exists tpa_consent_user_idx on public.tpa_consent_records(user_id);
create index if not exists tpa_consent_type_idx on public.tpa_consent_records(consent_type);
create index if not exists tpa_consent_recorded_idx on public.tpa_consent_records(recorded_at);

-- Enable RLS
alter table public.tpa_consent_records enable row level security;

-- RLS Policies
-- Users can view their own consent records
create policy "users_can_view_own_consent"
  on public.tpa_consent_records
  for select
  using (user_id = auth.uid());

-- Users can insert their own consent records
create policy "users_can_insert_own_consent"
  on public.tpa_consent_records
  for insert
  with check (user_id = auth.uid());

-- Admins can view consent records in their tenant
create policy "admins_can_view_tenant_consent"
  on public.tpa_consent_records
  for select
  using (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  );

-- Function to get latest consent status for a user
create or replace function public.tpa_get_consent_status(
  p_user_id uuid,
  p_consent_type text
)
returns table (
  granted boolean,
  policy_version text,
  recorded_at timestamptz
) language sql stable as $$
  select granted, policy_version, recorded_at
  from public.tpa_consent_records
  where user_id = p_user_id
    and consent_type = p_consent_type
  order by recorded_at desc
  limit 1;
$$;

comment on table public.tpa_consent_records is 'Privacy and consent tracking for GDPR/CCPA compliance';
comment on column public.tpa_consent_records.consent_type is 'Type of consent: privacy_policy, terms_of_service, data_processing, etc.';
comment on column public.tpa_consent_records.policy_version is 'Version of the policy being consented to';
