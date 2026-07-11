-- Migration: 003_tpa_memberships.sql
-- Phase 1: Foundation - Tenant memberships and roles

-- Tenant memberships table: User-tenant relationships
create table if not exists public.tpa_tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tpa_tenants(id) on delete cascade,
  user_id uuid not null references public.tpa_profiles(id) on delete cascade,
  role text not null check (role in (
    'client_owner',
    'client_team_member',
    'facilitator',
    'senior_reviewer',
    'organization_admin',
    'white_label_admin',
    'system_admin'
  )),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid references public.tpa_profiles(id),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

-- Indexes
create index if not exists tpa_memberships_tenant_idx on public.tpa_tenant_memberships(tenant_id);
create index if not exists tpa_memberships_user_idx on public.tpa_tenant_memberships(user_id);
create index if not exists tpa_memberships_role_idx on public.tpa_tenant_memberships(role);
create index if not exists tpa_memberships_status_idx on public.tpa_tenant_memberships(status);

-- Trigger for updated_at
create trigger tpa_tenant_memberships_updated_at
  before update on public.tpa_tenant_memberships
  for each row
  execute function public.tpa_update_updated_at_column();

-- Enable RLS
alter table public.tpa_tenant_memberships enable row level security;

-- Helper function: Check if user is tenant member
create or replace function public.tpa_is_tenant_member(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tpa_tenant_memberships
    where tenant_id = p_tenant_id 
      and user_id = auth.uid() 
      and status = 'active'
  );
$$;

-- Helper function: Check if user has specific role(s) in tenant
create or replace function public.tpa_has_tenant_role(p_tenant_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tpa_tenant_memberships
    where tenant_id = p_tenant_id 
      and user_id = auth.uid()
      and status = 'active' 
      and role = any(p_roles)
  );
$$;

-- RLS Policies
-- Users can view memberships in their tenants
create policy "memberships_tenant_select"
  on public.tpa_tenant_memberships
  for select
  using (public.tpa_is_tenant_member(tenant_id));

-- Admins can manage memberships in their tenant
create policy "admins_can_manage_memberships"
  on public.tpa_tenant_memberships
  for all
  using (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  )
  with check (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin', 
      'white_label_admin', 
      'system_admin'
    ])
  );

-- Users can view their own memberships
create policy "users_can_view_own_memberships"
  on public.tpa_tenant_memberships
  for select
  using (user_id = auth.uid());

comment on table public.tpa_tenant_memberships is 'User-tenant relationships with roles';
comment on column public.tpa_tenant_memberships.role is 'client_owner, client_team_member, facilitator, senior_reviewer, organization_admin, white_label_admin, system_admin';
comment on column public.tpa_tenant_memberships.status is 'invited, active, suspended, removed';
