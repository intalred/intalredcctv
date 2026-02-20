# CCTV San Martín – WebApp (Producción ISO)

## Incluye (nivel producción ISO)
- Login público con usuario tipo `operador1` + contraseña (se transforma a email `{usuario}@sanmartin.local`)
- Inventario de activos CCTV
- Bitácora por turno + checklist inicial automático (cámaras criticidad ALTA + muestra)
- Tickets / incidentes con SLA por prioridad
- Órdenes de trabajo (OT) de mantenimiento
- Cadena de custodia SIN subir video: registro + SHA256 + firma digital
- Auditoría ISO: auditorías, hallazgos (NC/OBS/OP), export CSV para auditor
- Dashboard con KPIs/OKRs (consulta tablas `kpi_snapshots` y `okrs`)

## 1) Supabase (SQL)
1. Crea proyecto en Supabase.
2. Ejecuta tu **esquema base** (assets, profiles, shift_logs, shift_checks, tickets, work_orders, custody_records, kpi_snapshots, okrs, okr_key_results, etc.).
3. Ejecuta el SQL de producción:
   - `supabase/SCHEMA_AUDIT_OKR_KPI_RLS.sql`
   Esto crea tablas de auditoría + firma digital + activa RLS y políticas por rol.

## 2) Crear usuarios (5)
Crea usuarios en Supabase Auth con email:
- `operador1@sanmartin.local`
- `jefe1@sanmartin.local`
- `ti1@sanmartin.local`
- `gerencia1@sanmartin.local`
- `proveedor1@sanmartin.local`

Luego inserta/actualiza sus perfiles en tabla `profiles` con roles:
- OPERADOR, JEFE_SEGURIDAD, TI, GERENCIA, PROVEEDOR

## 3) Variables de entorno
Copia `.env.local.example` -> `.env.local`
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN=sanmartin.local

## 4) Ejecutar local
```bash
npm install
npm run dev
```

## 5) Publicar (Vercel)
- Importa el proyecto en Vercel.
- Configura variables de entorno.
- Despliega.
- Recomendación: MFA para cuentas críticas (Supabase) y rotación de contraseñas.

## Seguridad
- RLS habilitado (ver SQL). Ajusta políticas si deseas que OPERADOR solo vea sus bitácoras/tickets.

## Branding (Logo)
- Reemplaza `public/logo-sanmartin.svg` por tu logo oficial (puede ser SVG o PNG).
- Si usas PNG, nómbralo igual `logo-sanmartin.svg` o ajusta la ruta en `components/Shell.tsx`.
- Favicon: `public/favicon.svg` (Vercel/Next lo usará si lo configuras como icon en metadata; opcional).


## Logo aplicado
- Se aplicó el logo suministrado en `public/logo-intalred.png`.
- Favicon generado en `public/favicon.png` y `app/icon.png`.
- Para cambiarlo: reemplaza esos archivos y ajusta `components/Shell.tsx` si cambias el nombre.
