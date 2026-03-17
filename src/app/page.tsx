import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero */}
      <section className="relative bg-[#1e1b4b] text-white">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Turnio
          </h1>
          <p className="mt-4 text-xl text-[#2dd4bf] font-medium sm:text-2xl">
            Tu turno, sin llamadas
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-indigo-200 leading-relaxed">
            La plataforma para que cualquier negocio reciba reservas online,
            cobre con Mercado Pago y sincronice todo con Google Calendar.
            Sin llamadas, sin WhatsApp, sin confusiones.
          </p>
          <div className="mt-10">
            <Link
              href="/demo-peluqueria"
              className="inline-block rounded-full bg-[#2dd4bf] px-8 py-3.5 text-base font-semibold text-[#1e1b4b] shadow-lg transition hover:bg-[#5eead4] hover:shadow-xl"
            >
              Ver demo
            </Link>
          </div>
        </div>
        {/* Decorative bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 56h1440V28C1200 0 240 0 0 28v28z"
              fill="#fafafa"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#fafafa] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-[#1e1b4b] sm:text-4xl">
            Todo lo que necesitas
          </h2>
          <p className="mt-3 text-center text-lg text-zinc-500">
            Simple para vos, simple para tus clientes.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e1b4b] text-[#2dd4bf] text-xl font-bold">
                24
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#1e1b4b]">
                Reserva online 24/7
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Tus clientes reservan cuando quieran, desde cualquier
                dispositivo. Sin esperas, sin llamadas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e1b4b] text-[#2dd4bf] text-xl font-bold">
                $
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#1e1b4b]">
                Pagos con Mercado Pago
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Cobra por adelantado con Checkout Pro. El dinero va directo
                a tu cuenta de Mercado Pago.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e1b4b] text-[#2dd4bf] text-xl font-bold">
                G
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#1e1b4b]">
                Google Calendar
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Cada reserva se sincroniza automaticamente con tu calendario
                y el de tu cliente.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e1b4b] text-[#2dd4bf] text-xl font-bold">
                *
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#1e1b4b]">
                Para cualquier negocio
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Peluqueria, consultorio, estudio de yoga, barberia...
                Si das turnos, Turnio es para vos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e1b4b] py-8 text-center">
        <p className="text-sm text-indigo-300">
          Hecho con{" "}
          <span className="font-semibold text-[#2dd4bf]">Turnio</span>
        </p>
      </footer>
    </div>
  );
}
