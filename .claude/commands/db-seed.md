Ejecutá el seed completo de la base de datos usando el MCP de Neon.

**Primero, limpiar datos de prueba existentes** (en orden por FK constraints):
```sql
DELETE FROM blocked_slots;
DELETE FROM appointments;
DELETE FROM availability;
DELETE FROM services;
DELETE FROM sessions;
DELETE FROM accounts;
DELETE FROM verification_tokens;
DELETE FROM tenants;
DELETE FROM users WHERE email IN ('admin@turnio.app', 'maria@demo.com', 'carlos@demo.com', 'cliente@demo.com');
```

**Luego, insertar datos de seed**:

1. **Super admin user** (password: `Admin123!` hasheado con bcrypt):
```sql
INSERT INTO users (id, name, email, password, role)
VALUES ('sa-001', 'Super Admin', 'admin@turnio.app', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin');
```

2. **Tenant demo**:
```sql
INSERT INTO tenants (slug, name, description, address, phone, owner_id, is_active)
VALUES ('demo-peluqueria', 'Peluquería Demo', 'Peluquería de prueba para desarrollo', 'Av. Corrientes 1234, CABA', '+54 11 1234-5678', 'sa-001', true);
```

3. **Providers** (password: `Provider123!`):
```sql
INSERT INTO users (id, name, email, password, role, tenant_id)
VALUES
  ('prov-001', 'María López', 'maria@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'provider', (SELECT id FROM tenants WHERE slug = 'demo-peluqueria')),
  ('prov-002', 'Carlos García', 'carlos@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'provider', (SELECT id FROM tenants WHERE slug = 'demo-peluqueria'));
```

4. **Servicios** (3 servicios para el tenant demo):
```sql
INSERT INTO services (tenant_id, provider_id, name, description, duration_minutes, price, currency, is_active)
VALUES
  ((SELECT id FROM tenants WHERE slug = 'demo-peluqueria'), 'prov-001', 'Corte de pelo', 'Corte clásico o moderno', 30, 5000.00, 'ARS', true),
  ((SELECT id FROM tenants WHERE slug = 'demo-peluqueria'), 'prov-001', 'Tintura completa', 'Tintura con productos premium', 90, 15000.00, 'ARS', true),
  ((SELECT id FROM tenants WHERE slug = 'demo-peluqueria'), 'prov-002', 'Barba', 'Recorte y perfilado de barba', 20, 3000.00, 'ARS', true);
```

5. **Disponibilidad semanal** (lunes a viernes 9:00–18:00 para ambos providers):
```sql
INSERT INTO availability (provider_id, day_of_week, start_time, end_time, is_active)
SELECT provider_id, day, '09:00', '18:00', true
FROM (VALUES ('prov-001'), ('prov-002')) AS p(provider_id)
CROSS JOIN generate_series(1, 5) AS day;
```

6. **Cliente de prueba** (password: `Client123!`):
```sql
INSERT INTO users (id, name, email, password, role)
VALUES ('client-001', 'Cliente Demo', 'cliente@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'client');
```

**Finalmente, verificar** ejecutando:
```sql
SELECT 'users' as tabla, count(*) as filas FROM users
UNION ALL SELECT 'tenants', count(*) FROM tenants
UNION ALL SELECT 'services', count(*) FROM services
UNION ALL SELECT 'availability', count(*) FROM availability;
```

Reportá el resultado de la verificación.
