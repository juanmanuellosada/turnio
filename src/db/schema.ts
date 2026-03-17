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
  password:           text('password'),
  role:               text('role').default('client')
                        .$type<'super_admin' | 'admin' | 'provider' | 'client'>(),
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
  dayOfWeek:  integer('day_of_week').notNull(),
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
                         .$type<'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'>(),
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
