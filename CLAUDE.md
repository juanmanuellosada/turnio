# CLAUDE.md — Turnio

> Sistema de turnos online multi-tenant con pagos vía Mercado Pago y sincronización con Google Calendar.

---

## 🤖 Autonomía de Claude Code

Este proyecto está configurado para que Claude Code opere de forma completamente autónoma. Antes de empezar cualquier tarea, Claude debe:

1. **Leer este archivo completo** (`CLAUDE.md`) y el `SETUP.md`
2. **Verificar los MCPs disponibles** con `/mcp` — deben estar activos: `neon`, `github`, `context7`, `puppeteer`
3. **No pedir confirmación** para operaciones de código, SQL o archivos — operar en modo autónomo
4. **Marcar checkboxes** en la sección de fases al completar cada tarea
5. **Commitear al final de cada fase** con mensaje semántico (`feat:`, `fix:`, `chore:`)

### Uso de MCPs

| MCP | Cuándo usarlo |
|-----|--------------|
| `neon` | Ejecutar SQL, verificar tablas, inspeccionar schema, debuggear datos |
| `github` | Commits, PRs, verificar CI/CD |
| `context7` | Documentación actualizada de Next.js, Drizzle, NextAuth, MP SDK |
| `puppeteer` | Testear el flujo de reserva en el browser automáticamente |

### Comandos de contexto para Claude Code
```
use context7 to get docs for: drizzle orm neon postgresql
use context7 to get docs for: next-auth v5 credentials provider drizzle adapter
use context7 to get docs for: mercadopago node sdk checkout pro

use neon to run: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
use neon to run: SELECT * FROM tenants LIMIT 5;

use puppeteer to: navigate to localhost:3000/demo-peluqueria and complete a booking flow
```

### Reglas de autonomía
- Error de TypeScript → corregirlo antes de continuar
- Migración Drizzle falla → leer error, corregir schema, reejecutar `drizzle-kit push`
- Test de Puppeteer falla → debuggear y corregir hasta que pase
- Variable de entorno falta → indicar exactamente cuál y dónde obtenerla, luego pausar
- Nunca hardcodear secrets → siempre `process.env.*`
- Usar Neon MCP para verificar estado real de la DB antes de asumir

---

## 🎯 Visión del producto

**Turnio** es una plataforma SaaS multi-tenant donde cualquier prestador de servicios (peluquería, consultorio, estudio de yoga, etc.) puede tener su propio espacio en `turnio.app/[slug]`, publicar su disponibilidad, recibir reservas de clientes, cobrar online vía Mercado Pago Checkout Pro y tener los turnos sincronizados en Google Calendar para ambas partes.

---

## 🧱 Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 15** (App Router, Server Actions) |
| Base de datos | **Neon** — PostgreSQL serverless (proyectos ilimitados en free tier) |
| ORM | **Drizzle ORM** — type-safe, migraciones con `drizzle-kit push` |
| Autenticación | **NextAuth.js v5** — Credentials provider (email + password) |
| Pagos | **Mercado Pago Checkout Pro** (pago directo al prestador) |
| Calendario | **Google Calendar API** (OAuth 2.0) |
| Emails | **Resend** + React Email (confirmación + recordatorio 24hs) |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** |
| Deploy | **Vercel** (free tier — integración nativa con Neon) |
| Lenguaje | **TypeScript** estricto en todo el proyecto |

---

## 👥 Roles del sistema

### `super_admin`
- Accede a `/super-admin`
- Crea, suspende y elimina tenants
- Ve métricas globales de la plataforma

### `admin`
- Dueño de un tenant (negocio)
- Configura slug, nombre, logo, credenciales de Mercado Pago
- Crea y gestiona prestadores y servicios
- Ve todos los turnos de su negocio

### `provider` (prestador de servicio)
- Pertenece a un tenant
- Define sus horarios de disponibilidad
- Ve su agenda de turnos
- Conecta su Google Calendar

### `client` (cliente final)
- Se registra públicamente o desde el link del negocio
- Reserva turnos y paga con Mercado Pago
- Ve historial de turnos
- Opcionalmente conecta Google Calendar

---

## 🗄️ Schema — Drizzle ORM (`src/db/schema.ts`)

```typescript
import {
  pgTable, text, uuid, boolean, integer,
  numeric, timestamp, time, jsonb
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// NextAuth required tables
export const users = pgTable('users', {
  id:                 text('id').primaryKey(),
  name:               text('name'),
  email:              text('email').unique(),
  emailVerified:      timestamp('email_verified', { mode: 'date' }),
  image:              text('image'),
  password:           text('password'),        // bcrypt hash
  role:               text('role').default('client')
                        .$type<'super_admin'|'admin'|'provider'|'client'>(),
  tenantId:           uuid('tenant_id'),
  phone:              text('phone'),
  googleRefreshToken: text('google_refresh_token'),
  googleCalendarId:   text('google_calendar_id'),
  createdAt:          timestamp('created_at').defaultNow(),
  updatedAt:          timestamp('updated_at').defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId:            text('user_id').notNull(),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId:       text('user_id').notNull(),
  expires:      timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
})

// Dominio de Turnio
export const tenants = pgTable('tenants', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug:          text('slug').unique().notNull(),
  name:          text('name').notNull(),
  description:   text('description'),
  logoUrl:       text('logo_url'),
  address:       text('address'),
  phone:         text('phone'),
  ownerId:       text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  mpAccessToken: text('mp_access_token'),
  mpPublicKey:   text('mp_public_key'),
  isActive:      boolean('is_active').default(true),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
})

export const services = pgTable('services', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  providerId:      text('provider_id').references(() => users.id, { onDelete: 'set null' }),
  name:            text('name').notNull(),
  description:     text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  price:           numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency:        text('currency').default('ARS'),
  isActive:        boolean('is_active').default(true),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
})

export const availability = pgTable('availability', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  providerId: text('provider_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek:  integer('day_of_week').notNull(),   // 0=domingo ... 6=sábado
  startTime:  time('start_time').notNull(),
  endTime:    time('end_time').notNull(),
  isActive:   boolean('is_active').default(true),
})

export const appointments = pgTable('appointments', {
  id:                  uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  providerId:          text('provider_id').notNull().references(() => users.id),
  clientId:            text('client_id').notNull().references(() => users.id),
  serviceId:           uuid('service_id').notNull().references(() => services.id),
  startsAt:            timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:              timestamp('ends_at', { withTimezone: true }).notNull(),
  status:              text('status').default('pending')
                         .$type<'pending'|'confirmed'|'cancelled'|'completed'|'no_show'>(),
  mpPreferenceId:      text('mp_preference_id'),
  mpPaymentId:         text('mp_payment_id'),
  mpPaymentStatus:     text('mp_payment_status'),
  mpPaymentDetail:     jsonb('mp_payment_detail'),
  amountPaid:          numeric('amount_paid', { precision: 10, scale: 2 }),
  clientGcalEventId:   text('client_gcal_event_id'),
  providerGcalEventId: text('provider_gcal_event_id'),
  notes:               text('notes'),
  cancellationReason:  text('cancellation_reason'),
  reminderSent:        boolean('reminder_sent').default(false),
  createdAt:           timestamp('created_at').defaultNow(),
  updatedAt:           timestamp('updated_at').defaultNow(),
})

export const blockedSlots = pgTable('blocked_slots', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  providerId: text('provider_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startsAt:   timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt:     timestamp('ends_at', { withTimezone: true }).notNull(),
  reason:     text('reason'),
  createdAt:  timestamp('created_at').defaultNow(),
})
```

---

## 🗂️ Estructura de carpetas

```
turnio/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                        # Landing de Turnio
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                    # Página pública del negocio
│   │   │       ├── reservar/page.tsx           # Stepper de reserva
│   │   │       └── confirmacion/page.tsx       # Post-pago
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                      # Sidebar según rol
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── mis-turnos/page.tsx
│   │   │   ├── agenda/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── prestadores/page.tsx
│   │   │   │   ├── servicios/page.tsx
│   │   │   │   ├── turnos/page.tsx
│   │   │   │   └── configuracion/page.tsx
│   │   │   └── super-admin/
│   │   │       ├── page.tsx
│   │   │       └── tenants/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/mercadopago/route.ts
│   │       ├── calendar/
│   │       │   ├── connect/route.ts
│   │       │   └── callback/route.ts
│   │       ├── appointments/
│   │       │   ├── route.ts
│   │       │   └── [id]/cancel/route.ts
│   │       ├── health/route.ts
│   │       └── cron/reminders/route.ts
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui
│   │   ├── booking/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ProviderSelector.tsx
│   │   │   ├── DateTimePicker.tsx
│   │   │   └── BookingSummary.tsx
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── CalendarView.tsx
│   │   └── shared/
│   │       ├── TurnioLogo.tsx
│   │       └── RoleBadge.tsx
│   ├── db/
│   │   ├── index.ts                            # Neon + Drizzle client
│   │   └── schema.ts                           # Schema completo
│   ├── lib/
│   │   ├── auth.ts                             # NextAuth config
│   │   ├── mercadopago/
│   │   │   ├── create-preference.ts
│   │   │   └── verify-webhook.ts
│   │   ├── google-calendar/
│   │   │   ├── create-event.ts
│   │   │   └── delete-event.ts
│   │   ├── emails/
│   │   │   ├── resend.ts
│   │   │   └── templates/
│   │   │       ├── confirmation.tsx
│   │   │       └── reminder.tsx
│   │   ├── availability.ts
│   │   └── utils.ts
│   └── types/index.ts
├── drizzle/                                    # Archivos de migración generados
├── drizzle.config.ts
├── auth.ts                                     # Re-export de NextAuth (requerido v5)
├── middleware.ts
├── vercel.json                                 # Cron job de recordatorios
├── .env.local.example
├── .mcp.json
├── CLAUDE.md
└── SETUP.md
```

---

## 🔐 Auth — NextAuth.js v5

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',      type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        })
        if (!user?.password) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role     = (user as any).role
        token.tenantId = (user as any).tenantId
        token.id       = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role     = token.role as string
      session.user.tenantId = token.tenantId as string
      session.user.id       = token.id as string
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
})
```

```typescript
// middleware.ts
import { auth } from './auth'
import { NextResponse } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  '/super-admin': ['super_admin'],
  '/admin':       ['admin', 'super_admin'],
  '/agenda':      ['provider', 'admin', 'super_admin'],
  '/mis-turnos':  ['client'],
  '/dashboard':   ['client', 'provider', 'admin', 'super_admin'],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const entry = Object.entries(ROLE_ROUTES).find(([r]) => pathname.startsWith(r))
  if (entry) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
    if (!entry[1].includes(session.user.role ?? ''))
      return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/agenda/:path*',
            '/mis-turnos/:path*', '/super-admin/:path*'],
}
```

---

## 🗃️ Drizzle + Neon

```typescript
// src/db/index.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'
export default {
  schema:    './src/db/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

---

## 💳 Mercado Pago — Checkout Pro

Cada tenant configura sus propias credenciales de MP en `Admin → Configuración → Pagos`. El dinero va directo a la cuenta MP del tenant (sin comisión de Turnio en el MVP).

```typescript
// src/lib/mercadopago/create-preference.ts
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function createPreference(appointment: any, service: any, tenant: any) {
  const client = new MercadoPagoConfig({ accessToken: tenant.mpAccessToken })
  return new Preference(client).create({
    body: {
      items: [{ title: service.name, quantity: 1, unit_price: Number(service.price), currency_id: 'ARS' }],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/confirmacion?appointment=${appointment.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/reservar?error=payment_failed`,
      },
      auto_return:        'approved',
      notification_url:   `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      external_reference: appointment.id,
    }
  })
}
```

---

## 📅 Google Calendar

**Scopes**: `https://www.googleapis.com/auth/calendar.events`

Al confirmar pago (webhook MP):
1. Crear evento en calendario del prestador con su `googleRefreshToken`
2. Si el cliente tiene `googleRefreshToken`, crear evento en su calendario
3. Guardar IDs en `appointments.providerGcalEventId` / `clientGcalEventId`
4. Al cancelar: eliminar ambos eventos

---

## 📧 Emails — Resend + React Email

```typescript
// src/lib/emails/resend.ts
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
```

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 12 * * *" }]
}
```

El cron de recordatorios corre diariamente a las 9am ART (12:00 UTC). Busca appointments donde `starts_at` está entre mañana 00:00 y 23:59 UTC y `reminder_sent = false`. Envía email a cliente y prestador, luego setea `reminder_sent = true`.

---

## 📐 Disponibilidad

```
Dado: providerId, serviceId, fecha
1. Obtener availability del provider para ese día de la semana (dayOfWeek)
2. Generar slots cada `service.durationMinutes` minutos en el rango start_time–end_time
3. Filtrar slots solapados con appointments status IN ('pending','confirmed')
4. Filtrar slots solapados con blocked_slots
5. Retornar: { startsAt: Date, available: boolean }[]
Timezone: convertir todo a America/Argentina/Buenos_Aires para mostrar, guardar en UTC
```

---

## 🎨 Diseño y UI

- **Nombre**: Turnio | **Tagline**: *"Tu turno, sin llamadas"*
- **Paleta**: azul índigo `#1e1b4b` + blanco roto `#fafafa` + acento verde agua `#2dd4bf`
- **Tipografía**: **Sora** (headings) + **DM Sans** (body) — via `next/font/google`
- **Componentes**: shadcn/ui como base
- **Mobile-first**: el flujo de reserva debe funcionar perfecto en móvil

---

## 📦 Dependencias completas

```bash
npx create-next-app@latest turnio --typescript --tailwind --app --src-dir --import-alias "@/*"

cd turnio

# DB
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# Auth
npm install next-auth@beta @auth/drizzle-adapter bcryptjs
npm install -D @types/bcryptjs

# Pagos
npm install mercadopago

# Google Calendar
npm install googleapis

# Emails
npm install resend @react-email/components react-email

# Utilidades
npm install date-fns
npm install -D @types/node

# UI
npx shadcn@latest init
# Seleccionar: Default style, Zinc color, CSS variables: yes
npx shadcn@latest add button card input label badge calendar tabs
```

---

## 🔑 Variables de entorno

```bash
# Neon (la más importante)
DATABASE_URL=postgresql://user:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth v5
AUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Mercado Pago (solo para verificar webhooks — cada tenant tiene su propio token en DB)
MP_WEBHOOK_SECRET=    # openssl rand -hex 32

# Google Calendar OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Neon MCP — solo para Claude Code, NO va en Vercel
NEON_API_KEY=napi_xxxxxxxxxxxx
```

---

## 📋 Fases de implementación

### Fase 1 — Fundación
- [ ] Crear proyecto Next.js 15 con flags correctos
- [ ] Instalar todas las dependencias
- [ ] Crear `src/db/schema.ts` con el schema completo de arriba
- [ ] Crear `drizzle.config.ts`
- [ ] Correr `npx drizzle-kit push` para aplicar schema a Neon
- [ ] Verificar con Neon MCP: todas las tablas creadas correctamente
- [ ] Configurar NextAuth v5: `src/lib/auth.ts`, `auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- [ ] Páginas `/login` y `/register` con validación y bcrypt
- [ ] `middleware.ts` con protección por rol
- [ ] `app/api/health/route.ts` → `{ ok: true }`
- [ ] Seed: tenant `demo-peluqueria` + usuario `super_admin`
- [ ] Commit: `feat: fase-1 fundacion completa`

### Fase 2 — Flujo público de reserva
- [ ] Landing `/` con hero y CTA
- [ ] Página pública `/[slug]`
- [ ] Stepper de reserva `/[slug]/reservar` (servicio → prestador → fecha/hora → confirmar)
- [ ] Lógica de slots disponibles (`src/lib/availability.ts`)
- [ ] Crear appointment en `pending` al llegar al paso de pago
- [ ] Seed completo: 2 providers + 3 servicios + disponibilidad
- [ ] Commit: `feat: fase-2 flujo publico`

### Fase 3 — Pagos con Mercado Pago
- [ ] `POST /api/appointments` → crea preferencia MP, retorna `init_point`
- [ ] Redirect a Checkout Pro
- [ ] `POST /api/webhooks/mercadopago` → verificar, actualizar a `confirmed`
- [ ] Página de confirmación y página de error
- [ ] Test con tarjetas de prueba de MP
- [ ] Commit: `feat: fase-3 pagos`

### Fase 4 — Google Calendar
- [ ] OAuth flow: `/api/calendar/connect` → `/api/calendar/callback`
- [ ] Guardar `google_refresh_token` en `users`
- [ ] Crear eventos al confirmar pago
- [ ] Eliminar eventos al cancelar
- [ ] Commit: `feat: fase-4 google-calendar`

### Fase 5 — Emails
- [ ] Templates con React Email (confirmación + recordatorio)
- [ ] Envío de confirmación desde webhook MP
- [ ] `vercel.json` con cron
- [ ] `/api/cron/reminders` con lógica de recordatorios
- [ ] Commit: `feat: fase-5 emails`

### Fase 6 — Dashboards
- [ ] Layout con sidebar según rol
- [ ] Dashboard cliente: turnos, historial, cancelar
- [ ] Dashboard prestador: agenda, disponibilidad, bloquear slots
- [ ] Dashboard admin: turnos, prestadores, servicios, config MP
- [ ] Dashboard super-admin: tenants
- [ ] Commit: `feat: fase-6 dashboards`

### Fase 7 — Deploy
- [ ] Variables de entorno en Vercel
- [ ] `vercel deploy`
- [ ] Actualizar `GOOGLE_REDIRECT_URI` y webhook de MP con URL producción
- [ ] Test end-to-end con Puppeteer
- [ ] Commit: `chore: deploy produccion`

---

## ⚠️ Consideraciones importantes

1. **Timezone**: Argentina = `America/Argentina/Buenos_Aires`. Guardar SIEMPRE en UTC. Usar `date-fns-tz` para convertir.
2. **MP Webhooks en local**: usar ngrok. La URL cambia al reiniciar — actualizar en el dashboard de MP.
3. **Google OAuth en Testing**: solo "test users" pueden autenticarse hasta verificar la app en Google.
4. **Tokens de MP de tenants**: NUNCA al frontend. Solo en Server Actions o Route Handlers.
5. **bcrypt en Edge Runtime**: hacer el hash en Route Handler, no en middleware (Edge no soporta bcrypt).
6. **drizzle-kit push**: en dev usar `push` (rápido). En producción usar `migrate` con archivos de migración.
7. **Neon free tier**: una DB, branching ilimitado, 0.5 GB storage, 190hs compute/mes — más que suficiente para el MVP.

---

## 📁 Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Este archivo — contexto completo para Claude Code |
| `SETUP.md` | Guía paso a paso de todos los servicios externos |
| `.mcp.json` | MCPs activos para este proyecto |
| `.env.local.example` | Template de variables con instrucciones |

---

## 🏁 Prompt para arrancar Claude Code

> "Leé el `CLAUDE.md` y el `SETUP.md` completos. El `.env.local` ya tiene `DATABASE_URL` de Neon y `AUTH_SECRET`. Verificá los MCPs con `/mcp` (neon, github, context7, puppeteer deben estar activos). Ejecutá la **Fase 1** completa: crear proyecto Next.js 15, instalar todas las dependencias del CLAUDE.md, crear el schema Drizzle, aplicar con `drizzle-kit push`, verificar las tablas con el MCP de Neon, configurar NextAuth v5, crear login/registro con bcrypt, middleware de rutas por rol, y seed inicial con tenant demo y super_admin. TypeScript estricto. Commit al terminar: `feat: fase-1 fundacion completa`."