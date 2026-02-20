-- ============================
-- CCTV San Martín (ISO) - SQL Producción
-- Incluye: Auditoría ISO, Acciones Correctivas, RLS por rol, Firma digital
-- Ejecuta en Supabase SQL Editor
-- ============================

-- 1) Firma digital (actas)
create table if not exists public.acta_signatures (
  id uuid primary key default gen_random_uuid(),
  custody_id uuid not null references public.custody_records(id) on delete cascade,
  signed_by uuid not null references public.profiles(user_id),
  signed_at timestamptz not null default now(),
  signature_data_url text not null,
  signer_full_name text not null,
  signer_role text not null,
  ip_address text null,
  user_agent text null
);

-- 2) Auditorías ISO
create table if not exists public.iso_audits (
  id uuid primary key default gen_random_uuid(),
  audit_date date not null,
  scope text not null,
  standard text not null check (standard in ('ISO9001','ISO27001','INTEGRADA')) default 'INTEGRADA',
  lead_auditor uuid not null references public.profiles(user_id),
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.iso_findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.iso_audits(id) on delete cascade,
  finding_type text not null check (finding_type in ('NC_MAYOR','NC_MENOR','OBSERVACION','OPORTUNIDAD')),
  clause text null, -- ej: "ISO 9001 9.1" o "ISO 27001 A.5.15"
  description text not null,
  risk_level text not null check (risk_level in ('ALTO','MEDIO','BAJO')) default 'MEDIO',
  owner uuid not null references public.profiles(user_id),
  due_date date not null,
  status text not null check (status in ('ABIERTA','EN_PROCESO','CERRADA','VERIFICADA')) default 'ABIERTA',
  created_at timestamptz not null default now()
);

create table if not exists public.iso_actions (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.iso_findings(id) on delete cascade,
  root_cause text not null,
  corrective_action text not null,
  preventive_action text null,
  responsible uuid not null references public.profiles(user_id),
  target_date date not null,
  effectiveness_check text null,
  status text not null check (status in ('PLANIFICADA','EN_EJECUCION','CERRADA','VERIFICADA')) default 'PLANIFICADA',
  created_at timestamptz not null default now()
);

-- ============================
-- 3) RLS (modelo por rol)
-- ============================
-- Nota: Ajusta si tu política exige que OPERADOR solo vea sus registros.
-- Este modelo permite que JEFE_SEGURIDAD/TI/Gerencia vean todo.
-- ============================

-- helper: rol actual
create or replace function public.current_role()
returns text
language sql stable
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

-- helper: activo
create or replace function public.is_active_user()
returns boolean
language sql stable
as $$
  select coalesce(is_active, false) from public.profiles where user_id = auth.uid();
$$;

-- activar RLS
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.shift_logs enable row level security;
alter table public.shift_checks enable row level security;
alter table public.tickets enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.work_orders enable row level security;
alter table public.custody_records enable row level security;
alter table public.acta_signatures enable row level security;
alter table public.kpi_snapshots enable row level security;
alter table public.okrs enable row level security;
alter table public.okr_key_results enable row level security;
alter table public.iso_audits enable row level security;
alter table public.iso_findings enable row level security;
alter table public.iso_actions enable row level security;

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
using (public.is_active_user());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ASSETS: lectura para todos; escritura para TI y JEFE_SEGURIDAD
drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets for select
using (public.is_active_user());

drop policy if exists assets_write on public.assets;
create policy assets_write on public.assets for all
using (public.current_role() in ('TI','JEFE_SEGURIDAD'))
with check (public.current_role() in ('TI','JEFE_SEGURIDAD'));

-- SHIFT LOGS: OPERADOR/JEFE/TI pueden crear; lectura para activos
drop policy if exists shift_logs_select on public.shift_logs;
create policy shift_logs_select on public.shift_logs for select
using (public.is_active_user());

drop policy if exists shift_logs_insert on public.shift_logs;
create policy shift_logs_insert on public.shift_logs for insert
with check (public.current_role() in ('OPERADOR','JEFE_SEGURIDAD','TI'));

-- SHIFT CHECKS: insert/update solo OPERADOR/JEFE/TI
drop policy if exists shift_checks_select on public.shift_checks;
create policy shift_checks_select on public.shift_checks for select
using (public.is_active_user());

drop policy if exists shift_checks_write on public.shift_checks;
create policy shift_checks_write on public.shift_checks for all
using (public.current_role() in ('OPERADOR','JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('OPERADOR','JEFE_SEGURIDAD','TI'));

-- TICKETS: insert para todos menos GERENCIA; update para asignados/JEFE/TI
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets for select using (public.is_active_user());

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert
with check (public.current_role() in ('OPERADOR','JEFE_SEGURIDAD','TI','PROVEEDOR'));

drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets for update
using (
  public.current_role() in ('JEFE_SEGURIDAD','TI')
  or assigned_to = auth.uid()
  or reported_by = auth.uid()
)
with check (
  public.current_role() in ('JEFE_SEGURIDAD','TI')
  or assigned_to = auth.uid()
  or reported_by = auth.uid()
);

-- WORK ORDERS: PROVEEDOR ve solo asignadas
drop policy if exists work_orders_select on public.work_orders;
create policy work_orders_select on public.work_orders for select
using (
  public.is_active_user()
  and (
    public.current_role() <> 'PROVEEDOR'
    or assigned_to = auth.uid()
  )
);

drop policy if exists work_orders_write on public.work_orders;
create policy work_orders_write on public.work_orders for all
using (public.current_role() in ('TI','JEFE_SEGURIDAD','PROVEEDOR'))
with check (public.current_role() in ('TI','JEFE_SEGURIDAD','PROVEEDOR'));

-- CUSTODY + SIGNATURES: solo JEFE/TI crean; GERENCIA puede leer
drop policy if exists custody_select on public.custody_records;
create policy custody_select on public.custody_records for select
using (public.current_role() in ('JEFE_SEGURIDAD','TI','GERENCIA'));

drop policy if exists custody_insert on public.custody_records;
create policy custody_insert on public.custody_records for insert
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

drop policy if exists acta_select on public.acta_signatures;
create policy acta_select on public.acta_signatures for select
using (public.current_role() in ('JEFE_SEGURIDAD','TI','GERENCIA'));

drop policy if exists acta_insert on public.acta_signatures;
create policy acta_insert on public.acta_signatures for insert
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

-- KPI/OKR: GERENCIA/JEFE/TI leen; JEFE/TI escriben
drop policy if exists kpi_select on public.kpi_snapshots;
create policy kpi_select on public.kpi_snapshots for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists kpi_write on public.kpi_snapshots;
create policy kpi_write on public.kpi_snapshots for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

drop policy if exists okr_select on public.okrs;
create policy okr_select on public.okrs for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists okr_write on public.okrs;
create policy okr_write on public.okrs for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

drop policy if exists okrkr_select on public.okr_key_results;
create policy okrkr_select on public.okr_key_results for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists okrkr_write on public.okr_key_results;
create policy okrkr_write on public.okr_key_results for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

-- AUDITORÍA: GERENCIA/JEFE/TI leen; JEFE/TI escriben
drop policy if exists audit_select on public.iso_audits;
create policy audit_select on public.iso_audits for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists audit_write on public.iso_audits;
create policy audit_write on public.iso_audits for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

drop policy if exists findings_select on public.iso_findings;
create policy findings_select on public.iso_findings for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists findings_write on public.iso_findings;
create policy findings_write on public.iso_findings for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));

drop policy if exists actions_select on public.iso_actions;
create policy actions_select on public.iso_actions for select
using (public.current_role() in ('GERENCIA','JEFE_SEGURIDAD','TI'));

drop policy if exists actions_write on public.iso_actions;
create policy actions_write on public.iso_actions for all
using (public.current_role() in ('JEFE_SEGURIDAD','TI'))
with check (public.current_role() in ('JEFE_SEGURIDAD','TI'));
