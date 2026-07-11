-- Migration: 001_tpa_tenants.sql
-- Phase 1: Foundation - Multi-tenant architecture

-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Tenants table: Multi-tenant organizations
create table if not exists public.tpa_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for slug lookups
create index if not exists tpa_tenants_slug_idx on public.tpa_tenants(slug);
create index if not exists tpa_tenants_status_idx on public.tpa_tenants(status);

-- Trigger to auto-update updated_at
create or replace function public.tpa_update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tpa_tenants_updated_at
  before update on public.tpa_tenants
  for each row
  execute function public.tpa_update_updated_at_column();

-- Enable RLS
alter table public.tpa_tenants enable row level security;

-- RLS Policies
-- Users can view tenants they are members of
create policy "tenant_members_can_view"
  on public.tpa_tenants
  for select
  using (
    exists (
      select 1 from public.tpa_tenant_memberships
      where tenant_id = tpa_tenants.id
        and user_id = auth.uid()
        and status = 'active'
    )
  );

-- Only system admins can create tenants (application logic handles initial creation)
create policy "system_admins_can_insert"
  on public.tpa_tenants
  for insert
  with check (
    exists (
      select 1 from public.tpa_tenant_memberships
      where tenant_id = tpa_tenants.id
        and user_id = auth.uid()
        and role = 'system_admin'
        and status = 'active'
    )
  );

-- Organization admins and above can update their tenant
create policy "org_admins_can_update"
  on public.tpa_tenants
  for update
  using (
    exists (
      select 1 from public.tpa_tenant_memberships
      where tenant_id = tpa_tenants.id
        and user_id = auth.uid()
        and role in ('organization_admin', 'white_label_admin', 'system_admin')
        and status = 'active'
    )
  );

comment on table public.tpa_tenants is 'Multi-tenant organizations';
comment on column public.tpa_tenants.slug is 'URL-friendly unique identifier';
comment on column public.tpa_tenants.status is 'active, suspended, or archived';
