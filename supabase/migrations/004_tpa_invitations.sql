-- Migration: 004_tpa_invitations.sql
-- Phase 1: Foundation - Invitation system for private pilot

-- Invitations table: Track pending invitations
create table if not exists public.tpa_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tpa_tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in (
    'client_owner',
    'client_team_member',
    'facilitator',
    'senior_reviewer',
    'organization_admin',
    'white_label_admin',
    'system_admin'
  )),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references public.tpa_profiles(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists tpa_invitations_tenant_idx on public.tpa_invitations(tenant_id);
create index if not exists tpa_invitations_email_idx on public.tpa_invitations(email);
create index if not exists tpa_invitations_token_hash_idx on public.tpa_invitations(token_hash);
create index if not exists tpa_invitations_expires_idx on public.tpa_invitations(expires_at);

-- Enable RLS
alter table public.tpa_invitations enable row level security;

-- RLS Policies
-- Admins can view invitations in their tenant
create policy "admins_can_view_invitations"
  on public.tpa_invitations
  for select
  using (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  );

-- Admins can create invitations
create policy "admins_can_create_invitations"
  on public.tpa_invitations
  for insert
  with check (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  );

-- Admins can delete invitations (revoke)
create policy "admins_can_delete_invitations"
  on public.tpa_invitations
  for delete
  using (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  );

-- Anyone can view a valid invitation by token (for acceptance flow)
create policy "valid_invitations_selectable_by_token"
  on public.tpa_invitations
  for select
  using (
    accepted_at is null 
    and expires_at > now()
  );

-- Function to clean up expired invitations
create or replace function public.tpa_cleanup_expired_invitations()
returns void language sql security definer as $$
  delete from public.tpa_invitations
  where expires_at < now() - interval '7 days'
    and accepted_at is null;
$$;

comment on table public.tpa_invitations is 'Pending invitations for private pilot';
comment on column public.tpa_invitations.token_hash is 'Hashed invitation token for secure lookup';
comment on column public.tpa_invitations.metadata is 'Additional invitation context (pace preference, etc.)';
