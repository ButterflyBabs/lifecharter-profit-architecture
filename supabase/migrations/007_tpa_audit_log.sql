-- Migration: 007_tpa_audit_log.sql
-- Phase 1: Foundation - Comprehensive audit logging

-- Audit log table: Track all privileged changes
create table if not exists public.tpa_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tpa_tenants(id) on delete cascade,
  user_id uuid references public.tpa_profiles(id),
  action text not null check (action in (
    'create',
    'update',
    'delete',
    'view_sensitive',
    'export',
    'approve',
    'reject',
    'override',
    'login',
    'logout',
    'invite_sent',
    'invite_accepted',
    'role_changed',
    'setting_changed'
  )),
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for efficient querying
create index if not exists tpa_audit_tenant_idx on public.tpa_audit_log(tenant_id);
create index if not exists tpa_audit_user_idx on public.tpa_audit_log(user_id);
create index if not exists tpa_audit_action_idx on public.tpa_audit_log(action);
create index if not exists tpa_audit_entity_idx on public.tpa_audit_log(entity_type, entity_id);
create index if not exists tpa_audit_created_idx on public.tpa_audit_log(created_at desc);

-- Enable RLS
alter table public.tpa_audit_log enable row level security;

-- RLS Policies
-- Admins can view audit logs in their tenant
create policy "admins_can_view_audit"
  on public.tpa_audit_log
  for select
  using (
    public.tpa_has_tenant_role(tenant_id, array[
      'organization_admin',
      'white_label_admin',
      'system_admin'
    ])
  );

-- System admins can view all audit logs
create policy "system_admins_can_view_all_audit"
  on public.tpa_audit_log
  for select
  using (
    exists (
      select 1 from public.tpa_tenant_memberships
      where user_id = auth.uid()
        and role = 'system_admin'
        and status = 'active'
    )
  );

-- Only service role can insert audit logs (prevents tampering)
create policy "service_role_can_insert_audit"
  on public.tpa_audit_log
  for insert
  with check (false); -- Inserted via trigger or service role only

-- Function to create audit log entry
create or replace function public.tpa_create_audit_log(
  p_tenant_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer as $$
declare
  v_audit_id uuid;
begin
  insert into public.tpa_audit_log (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) values (
    p_tenant_id,
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_metadata
  )
  returning id into v_audit_id;
  
  return v_audit_id;
end;
$$;

-- Function to automatically log changes on any table
create or replace function public.tpa_audit_trigger()
returns trigger language plpgsql security definer as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
  v_entity_type text;
  v_old_values jsonb;
  v_new_values jsonb;
begin
  -- Get current user
  v_user_id := auth.uid();
  
  -- Determine entity type from table name
  v_entity_type := TG_TABLE_NAME;
  
  -- Extract tenant_id if available
  if TG_OP = 'DELETE' then
    v_tenant_id := old.tenant_id;
    v_old_values := to_jsonb(old);
    v_new_values := null;
  elsif TG_OP = 'INSERT' then
    v_tenant_id := new.tenant_id;
    v_old_values := null;
    v_new_values := to_jsonb(new);
  else -- UPDATE
    v_tenant_id := new.tenant_id;
    v_old_values := to_jsonb(old);
    v_new_values := to_jsonb(new);
  end if;
  
  -- Insert audit log
  insert into public.tpa_audit_log (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) values (
    v_tenant_id,
    v_user_id,
    lower(TG_OP),
    v_entity_type,
    case 
      when TG_OP = 'DELETE' then old.id
      else new.id
    end,
    v_old_values,
    v_new_values
  );
  
  return coalesce(new, old);
end;
$$;

comment on table public.tpa_audit_log is 'Comprehensive audit trail for all privileged changes';
comment on column public.tpa_audit_log.action is 'Type of action performed';
comment on column public.tpa_audit_log.entity_type is 'Table or resource type being modified';
comment on column public.tpa_audit_log.old_values is 'Previous values (for updates/deletes)';
comment on column public.tpa_audit_log.new_values is 'New values (for creates/updates)';
