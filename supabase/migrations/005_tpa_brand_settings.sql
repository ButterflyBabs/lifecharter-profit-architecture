-- Migration: 005_tpa_brand_settings.sql
-- Phase 1: Foundation - White-label brand configuration

-- Tenant brand settings table: White-label configuration
create table if not exists public.tpa_tenant_brand_settings (
  tenant_id uuid primary key references public.tpa_tenants(id) on delete cascade,
  product_name text not null default 'The Profit Architecture',
  parent_brand text not null default 'LifeCharter Command Suite',
  advisor_name text not null default 'The Profit Architecture Advisor',
  report_name text not null default 'The Profit Architecture Business Assessment',
  logo_url text,
  favicon_url text,
  primary_color text default '#1F315B',
  secondary_color text default '#5E3B6C',
  accent_color text default '#D4AF63',
  support_email text,
  support_phone text,
  privacy_url text,
  terms_url text,
  custom_css text,
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
create trigger tpa_tenant_brand_settings_updated_at
  before update on public.tpa_tenant_brand_settings
  for each row
  execute function public.tpa_update_updated_at_column();

-- Enable RLS
alter table public.tpa_tenant_brand_settings enable row level security;

-- RLS Policies
-- Tenant members can view their brand settings
create policy "members_can_view_brand"
  on public.tpa_tenant_brand_settings
  for select
  using (public.tpa_is_tenant_member(tenant_id));

-- Admins can manage brand settings
create policy "admins_can_manage_brand"
  on public.tpa_tenant_brand_settings
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

-- Insert default brand settings when tenant is created
create or replace function public.tpa_create_default_brand_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.tpa_tenant_brand_settings (tenant_id)
  values (new.id);
  return new;
end;
$$;

create trigger tpa_tenant_default_brand
  after insert on public.tpa_tenants
  for each row
  execute function public.tpa_create_default_brand_settings();

comment on table public.tpa_tenant_brand_settings is 'White-label brand configuration per tenant';
comment on column public.tpa_tenant_brand_settings.product_name is 'Display name for the product';
comment on column public.tpa_tenant_brand_settings.advisor_name is 'Name shown for AI advisor';
comment on column public.tpa_tenant_brand_settings.report_name is 'Default report title';
