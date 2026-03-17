import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('Seeding database...')

  // Clean existing seed data (respecting FK order)
  await sql`DELETE FROM blocked_slots`
  await sql`DELETE FROM appointments`
  await sql`DELETE FROM availability`
  await sql`DELETE FROM services`
  await sql`DELETE FROM sessions`
  await sql`DELETE FROM accounts`
  await sql`DELETE FROM verification_tokens`
  await sql`DELETE FROM tenants`
  await sql`DELETE FROM users WHERE email IN ('admin@turnio.app', 'maria@demo.com', 'carlos@demo.com', 'cliente@demo.com')`

  const hashedPassword = await bcrypt.hash('Admin123!', 10)

  // 1. Super admin
  await db.insert(schema.users).values({
    id: 'sa-001',
    name: 'Super Admin',
    email: 'admin@turnio.app',
    password: hashedPassword,
    role: 'super_admin',
  })
  console.log('  Created super_admin: admin@turnio.app / Admin123!')

  // 2. Tenant demo
  const [tenant] = await db.insert(schema.tenants).values({
    slug: 'demo-peluqueria',
    name: 'Peluquería Demo',
    description: 'Peluquería de prueba para desarrollo de Turnio',
    address: 'Av. Corrientes 1234, CABA',
    phone: '+54 11 1234-5678',
    ownerId: 'sa-001',
    isActive: true,
    mpAccessToken: process.env.MP_TEST_ACCESS_TOKEN ?? null,
    mpPublicKey: process.env.MP_TEST_PUBLIC_KEY ?? null,
  }).returning()
  console.log(`  Created tenant: ${tenant.slug} (${tenant.id})`)

  // 3. Providers
  const providerPassword = await bcrypt.hash('Provider123!', 10)
  await db.insert(schema.users).values([
    {
      id: 'prov-001',
      name: 'María López',
      email: 'maria@demo.com',
      password: providerPassword,
      role: 'provider',
      tenantId: tenant.id,
    },
    {
      id: 'prov-002',
      name: 'Carlos García',
      email: 'carlos@demo.com',
      password: providerPassword,
      role: 'provider',
      tenantId: tenant.id,
    },
  ])
  console.log('  Created providers: maria@demo.com, carlos@demo.com')

  // 4. Services
  await db.insert(schema.services).values([
    {
      tenantId: tenant.id,
      providerId: 'prov-001',
      name: 'Corte de pelo',
      description: 'Corte clásico o moderno',
      durationMinutes: 30,
      price: '5000.00',
      currency: 'ARS',
      isActive: true,
    },
    {
      tenantId: tenant.id,
      providerId: 'prov-001',
      name: 'Tintura completa',
      description: 'Tintura con productos premium',
      durationMinutes: 90,
      price: '15000.00',
      currency: 'ARS',
      isActive: true,
    },
    {
      tenantId: tenant.id,
      providerId: 'prov-002',
      name: 'Barba',
      description: 'Recorte y perfilado de barba',
      durationMinutes: 20,
      price: '3000.00',
      currency: 'ARS',
      isActive: true,
    },
  ])
  console.log('  Created 3 services')

  // 5. Availability (Mon-Fri 9:00-18:00 for both providers)
  const availabilityRows = []
  for (const providerId of ['prov-001', 'prov-002']) {
    for (let day = 1; day <= 5; day++) {
      availabilityRows.push({
        providerId,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      })
    }
  }
  await db.insert(schema.availability).values(availabilityRows)
  console.log('  Created availability: Mon-Fri 9:00-18:00 for both providers')

  // 6. Client
  const clientPassword = await bcrypt.hash('Client123!', 10)
  await db.insert(schema.users).values({
    id: 'client-001',
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    password: clientPassword,
    role: 'client',
  })
  console.log('  Created client: cliente@demo.com / Client123!')

  console.log('\nSeed completed successfully!')
  console.log('\nUsers:')
  console.log('  admin@turnio.app    / Admin123!     (super_admin)')
  console.log('  maria@demo.com      / Provider123!  (provider)')
  console.log('  carlos@demo.com     / Provider123!  (provider)')
  console.log('  cliente@demo.com    / Client123!    (client)')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
