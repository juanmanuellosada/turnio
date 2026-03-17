-- ============================================================
-- TURNIO — Migración inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- O con: supabase db push
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- TENANTS (negocios/empresas en la plataforma)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  name             text NOT NULL,
  description      text,
  logo_url         text,
  address          text,
  phone            text,
  owner_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mp_access_token  text,    -- token de Mercado Pago del negocio (encriptado)
  mp_public_key    text,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- PROFILES (extiende auth.users de Supabase)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             text,
  email                 text,
  avatar_url            text,
  phone                 text,
  role                  text NOT NULL DEFAULT 'client'
                          CHECK (role IN ('super_admin','admin','provider','client')),
  tenant_id             uuid REFERENCES tenants(id) ON DELETE SET NULL,
  google_refresh_token  text,   -- para Google Calendar (guardado encriptado)
  google_calendar_id    text,   -- 'primary' o un calendar_id específico
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Trigger: crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- SERVICES (servicios que ofrece un tenant/provider)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name              text NOT NULL,
  description       text,
  duration_minutes  int NOT NULL CHECK (duration_minutes > 0),
  price             numeric(10,2) NOT NULL CHECK (price >= 0),
  currency          text NOT NULL DEFAULT 'ARS',
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- AVAILABILITY (horarios disponibles por provider)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week   int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  is_active     boolean DEFAULT true,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ------------------------------------------------------------
-- APPOINTMENTS (turnos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  client_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  service_id              uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  starts_at               timestamptz NOT NULL,
  ends_at                 timestamptz NOT NULL,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  -- Mercado Pago
  mp_preference_id        text,
  mp_payment_id           text,
  mp_payment_status       text,   -- approved, pending, rejected, cancelled
  mp_payment_detail       jsonb,  -- payload completo del webhook por si se necesita
  amount_paid             numeric(10,2),
  -- Google Calendar
  client_gcal_event_id    text,
  provider_gcal_event_id  text,
  -- Extra
  notes                   text,
  cancellation_reason     text,
  reminder_sent           boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  CONSTRAINT valid_appointment_time CHECK (ends_at > starts_at)
);

-- ------------------------------------------------------------
-- BLOCKED_SLOTS (vacaciones, días libres, bloqueos manuales)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocked_slots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  reason       text,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT valid_blocked_time CHECK (ends_at > starts_at)
);

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_availability_provider ON availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_provider ON blocked_slots(provider_id);

-- ------------------------------------------------------------
-- UPDATED_AT triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- TENANTS: público puede leer tenants activos, solo el owner puede modificar
CREATE POLICY "tenants_public_read" ON tenants
  FOR SELECT USING (is_active = true);

CREATE POLICY "tenants_owner_all" ON tenants
  FOR ALL USING (owner_id = auth.uid());

-- PROFILES: cada uno ve el suyo; admins ven los de su tenant; super_admin ve todos
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_same_tenant" ON profiles
  FOR SELECT USING (
    tenant_id IS NOT NULL AND
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- SERVICES: público puede leer servicios activos del tenant
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "services_admin_all" ON services
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- AVAILABILITY: público puede leer; provider puede editar la suya
CREATE POLICY "availability_public_read" ON availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "availability_provider_all" ON availability
  FOR ALL USING (provider_id = auth.uid());

-- APPOINTMENTS: client ve los suyos; provider ve los suyos; admin ve todos del tenant
CREATE POLICY "appointments_client_own" ON appointments
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "appointments_provider_own" ON appointments
  FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "appointments_admin_tenant" ON appointments
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "appointments_client_insert" ON appointments
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Service role bypasses RLS (para webhooks y cron jobs del servidor)
-- El SUPABASE_SERVICE_ROLE_KEY tiene bypass automático.

-- ------------------------------------------------------------
-- SEED: tenant demo + super_admin
-- (Reemplazar UUIDs por los reales después del primer registro)
-- ------------------------------------------------------------
-- Para crear el super_admin, registrarse normalmente y luego ejecutar:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'tu@email.com';

-- Tenant demo para desarrollo:
INSERT INTO tenants (slug, name, description, address, is_active)
VALUES (
  'demo-peluqueria',
  'Peluquería Demo',
  'Peluquería de prueba para desarrollo de Turnio',
  'Av. Corrientes 1234, CABA',
  true
) ON CONFLICT (slug) DO NOTHING;
