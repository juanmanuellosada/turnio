import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { services, tenants, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing required query parameter: slug' },
      { status: 400 }
    )
  }

  // Find tenant by slug
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  })

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    )
  }

  if (!tenant.isActive) {
    return NextResponse.json(
      { error: 'This business is currently inactive' },
      { status: 403 }
    )
  }

  // Get active services for this tenant, joined with provider info
  const tenantServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      price: services.price,
      currency: services.currency,
      providerId: services.providerId,
      providerName: users.name,
    })
    .from(services)
    .leftJoin(users, eq(services.providerId, users.id))
    .where(
      and(
        eq(services.tenantId, tenant.id),
        eq(services.isActive, true)
      )
    )

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: tenant.description,
      logoUrl: tenant.logoUrl,
    },
    services: tenantServices,
  })
}
