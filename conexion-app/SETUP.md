# Equipo Conexión — Setup Guide

## Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend/DB/Auth/Realtime**: Supabase (free tier)
- **Hosting**: Vercel (free tier)
- **Push notifications**: Web Push API (VAPID, free)
- **Costo mensual estimado: $0**

---

## 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Guardar: `Project URL`, `anon public key` y `service_role key`
3. En SQL Editor, ejecutar los archivos de migración en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
4. En Authentication → Settings → Email → habilitar "Enable email confirmations" = OFF (para magic links funcionen directamente)
5. En Authentication → URL Configuration → Site URL = `https://tu-app.vercel.app`

---

## 2. Generar claves VAPID (push notifications)

```bash
npx web-push generate-vapid-keys
```

Guarda las dos claves generadas.

---

## 3. Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project → importar este repositorio
2. En Environment Variables, agregar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:admin@thelifechurch.cl
```

3. Deploy

---

## 4. Crear el primer líder

En Supabase → Authentication → Users → Invite user (con el email del primer líder).

Luego en SQL Editor:
```sql
update profiles
set role = 'leader', name = 'Nombre del Líder', consent_accepted = true
where id = 'uuid-del-usuario';
```

A partir de ahí, ese líder puede invitar al resto desde la app.

---

## 5. Configurar notificaciones (Edge Function cron)

1. En Supabase → Edge Functions → Deploy `supabase/functions/send-saturday-reminders`
2. En Supabase → Secrets, agregar:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. En Supabase → Database → Extensions → habilitar `pg_cron`
4. En SQL Editor:
```sql
-- Ejecutar todos los sábados a las 10:00 AM hora Chile (UTC-3 = 13:00 UTC)
select cron.schedule(
  'saturday-reminders',
  '0 13 * * 6',
  $$select net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/send-saturday-reminders',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

---

## 6. Iconos PWA

Reemplazar los archivos en `public/icons/`:
- `icon-192.png` — 192×192px (logo Life Church sobre fondo negro)
- `icon-512.png` — 512×512px

Los voluntarios podrán instalar la app desde Chrome/Safari con "Agregar a pantalla de inicio".

---

## Estructura de pantallas

| URL | Quién accede | Descripción |
|-----|-------------|-------------|
| `/login` | Todos | Login / Magic Link |
| `/consent` | Primer acceso | Aviso de privacidad |
| `/dashboard` | Todos | Resumen y accesos rápidos |
| `/schedule/[year]/[month]` | Líderes, Coordinadores | Programación mensual |
| `/disponibilidad` | Líderes, Coordinadores | Ingresar disponibilidad |
| `/sunday/[date]` | Líderes, Coordinadores | Vista en vivo del domingo |
| `/voluntarios` | Líderes | CRUD de voluntarios |
| `/mi-escala` | Voluntarios | Ver mis servicios |
| `/configuracion` | Líderes | Equipos, áreas, tareas |

---

## Escalabilidad futura

La arquitectura soporta múltiples equipos (tabla `teams`) y potencialmente múltiples iglesias/campus, ya que todas las entidades están separadas por ID. Para habilitar multi-iglesia en el futuro, solo se necesita agregar una tabla `churches` y una columna `church_id` a las demás tablas.
