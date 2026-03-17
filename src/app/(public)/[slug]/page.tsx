import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { tenants, services, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch active tenant by slug
  const tenant = await db.query.tenants.findFirst({
    where: and(eq(tenants.slug, slug), eq(tenants.isActive, true)),
  });

  if (!tenant) {
    notFound();
  }

  // Fetch active services for this tenant with provider names
  const tenantServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      price: services.price,
      currency: services.currency,
      providerName: users.name,
    })
    .from(services)
    .leftJoin(users, eq(services.providerId, users.id))
    .where(
      and(eq(services.tenantId, tenant.id), eq(services.isActive, true))
    );

  return (
    <>
      {/* Tenant Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1e1b4b] sm:text-4xl">
          {tenant.name}
        </h1>
        {tenant.description && (
          <p className="mt-2 text-lg text-zinc-600">{tenant.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
          {tenant.address && (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {tenant.address}
            </span>
          )}
          {tenant.phone && (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {tenant.phone}
            </span>
          )}
        </div>
      </div>

      {/* Services */}
      <h2 className="mb-6 text-xl font-semibold text-[#1e1b4b]">
        Servicios disponibles
      </h2>

      {tenantServices.length === 0 ? (
        <p className="text-zinc-500">
          Este negocio aun no tiene servicios disponibles.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tenantServices.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-[#1e1b4b]">
                {service.name}
              </h3>
              {service.description && (
                <p className="mt-1 text-sm text-zinc-500">
                  {service.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-[#1e1b4b]">
                  {service.durationMinutes} min
                </span>
                <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700">
                  ${service.price} {service.currency}
                </span>
                {service.providerName && (
                  <span className="text-zinc-400">
                    con {service.providerName}
                  </span>
                )}
              </div>
              <div className="mt-5">
                <Link
                  href={`/${slug}/reservar?serviceId=${service.id}`}
                  className="inline-block rounded-full bg-[#2dd4bf] px-6 py-2.5 text-sm font-semibold text-[#1e1b4b] transition hover:bg-[#5eead4]"
                >
                  Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back to Turnio */}
      <div className="mt-12 text-center">
        <p className="text-sm text-zinc-400">
          Powered by{" "}
          <Link href="/" className="font-medium text-[#2dd4bf] hover:underline">
            Turnio
          </Link>
        </p>
      </div>
    </>
  );
}
