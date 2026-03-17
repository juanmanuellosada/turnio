'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TenantInfo {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string
  currency: string | null
  providerId: string | null
  providerName: string | null
}

interface Slot {
  startsAt: string
  available: boolean
}

interface GuestInfo {
  name: string
  email: string
  phone: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: string, currency: string | null): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency ?? 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(price))
}

const STEPS = ['Servicio', 'Prestador', 'Fecha y hora', 'Confirmar'] as const

// ─── Stepper Component ──────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((label, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-[#2dd4bf] text-white'
                    : isCompleted
                      ? 'bg-[#1e1b4b] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`
                  text-xs mt-1 hidden sm:block
                  ${isActive ? 'text-[#1e1b4b] font-semibold' : 'text-gray-400'}
                `}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`
                  w-6 sm:w-12 h-0.5 mx-1 sm:mx-2
                  ${stepNum < currentStep ? 'bg-[#1e1b4b]' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Service Selection ──────────────────────────────────────────────

function ServiceStep({
  services,
  selectedServiceId,
  onSelect,
}: {
  services: Service[]
  selectedServiceId: string | null
  onSelect: (service: Service) => void
}) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No hay servicios disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1e1b4b] mb-4">
        Elegí un servicio
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={`
                text-left p-4 rounded-xl border-2 transition-all duration-200
                hover:shadow-md
                ${isSelected
                  ? 'border-[#2dd4bf] bg-[#2dd4bf]/5 shadow-md'
                  : 'border-gray-200 hover:border-[#2dd4bf]/50'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-[#1e1b4b]">{service.name}</h3>
                <span className="text-[#2dd4bf] font-bold text-lg whitespace-nowrap ml-2">
                  {formatPrice(service.price, service.currency)}
                </span>
              </div>
              {service.description && (
                <p className="text-gray-500 text-sm mb-2">{service.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.durationMinutes} min
                </span>
                {service.providerName && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {service.providerName}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Provider Selection ─────────────────────────────────────────────

function ProviderStep({
  providers,
  selectedProviderId,
  onSelect,
}: {
  providers: { id: string; name: string }[]
  selectedProviderId: string | null
  onSelect: (provider: { id: string; name: string }) => void
}) {
  if (providers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No hay prestadores disponibles para este servicio.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1e1b4b] mb-4">
        Elegí un prestador
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const isSelected = selectedProviderId === provider.id
          return (
            <button
              key={provider.id}
              onClick={() => onSelect(provider)}
              className={`
                flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                hover:shadow-md
                ${isSelected
                  ? 'border-[#2dd4bf] bg-[#2dd4bf]/5 shadow-md'
                  : 'border-gray-200 hover:border-[#2dd4bf]/50'
                }
              `}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                  ${isSelected ? 'bg-[#2dd4bf] text-white' : 'bg-[#1e1b4b]/10 text-[#1e1b4b]'}
                `}
              >
                {provider.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-[#1e1b4b]">{provider.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Date & Time Selection ──────────────────────────────────────────

function DateTimeStep({
  selectedDate,
  selectedTime,
  slots,
  loadingSlots,
  onSelectDate,
  onSelectTime,
}: {
  selectedDate: string | null
  selectedTime: string | null
  slots: Slot[]
  loadingSlots: boolean
  onSelectDate: (date: string) => void
  onSelectTime: (time: string) => void
}) {
  const today = new Date()
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1))

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1e1b4b] mb-4">
        Elegí fecha y hora
      </h2>

      {/* Date selector */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Fecha</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {dates.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`
                  flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2
                  min-w-[72px] transition-all duration-200
                  ${isSelected
                    ? 'border-[#2dd4bf] bg-[#2dd4bf]/5'
                    : 'border-gray-200 hover:border-[#2dd4bf]/50'
                  }
                `}
              >
                <span className="text-xs text-gray-400 uppercase">
                  {format(date, 'EEE', { locale: es })}
                </span>
                <span
                  className={`text-lg font-bold ${isSelected ? 'text-[#2dd4bf]' : 'text-[#1e1b4b]'}`}
                >
                  {format(date, 'd')}
                </span>
                <span className="text-xs text-gray-400">
                  {format(date, 'MMM', { locale: es })}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Horario</h3>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500">Cargando horarios...</span>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-center py-8 text-gray-400">
              No hay horarios disponibles para esta fecha.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot) => {
                const time = format(new Date(slot.startsAt), 'HH:mm')
                const isSelected = selectedTime === slot.startsAt
                return (
                  <button
                    key={slot.startsAt}
                    disabled={!slot.available}
                    onClick={() => onSelectTime(slot.startsAt)}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${!slot.available
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-[#2dd4bf] text-white shadow-md'
                          : 'bg-white border border-gray-200 text-[#1e1b4b] hover:border-[#2dd4bf] hover:text-[#2dd4bf]'
                      }
                    `}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Confirmation ───────────────────────────────────────────────────

function ConfirmStep({
  service,
  providerName,
  selectedTime,
  guestInfo,
  onGuestInfoChange,
  onConfirm,
  submitting,
}: {
  service: Service
  providerName: string
  selectedTime: string
  guestInfo: GuestInfo
  onGuestInfoChange: (info: GuestInfo) => void
  onConfirm: () => void
  submitting: boolean
}) {
  const dateObj = new Date(selectedTime)

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1e1b4b] mb-6">
        Confirmar reserva
      </h2>

      {/* Booking summary */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#1e1b4b]/90 text-white rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/70">Servicio</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Prestador</span>
            <span className="font-medium">{providerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Fecha</span>
            <span className="font-medium">
              {format(dateObj, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Hora</span>
            <span className="font-medium">{format(dateObj, 'HH:mm')} hs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Duración</span>
            <span className="font-medium">{service.durationMinutes} min</span>
          </div>
          <hr className="border-white/20" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-[#2dd4bf]">
              {formatPrice(service.price, service.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Guest info form */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium text-gray-600">Tus datos</h3>
        <div>
          <label htmlFor="guest-name" className="block text-sm text-gray-500 mb-1">
            Nombre completo
          </label>
          <input
            id="guest-name"
            type="text"
            value={guestInfo.name}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 outline-none transition-all"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="guest-email" className="block text-sm text-gray-500 mb-1">
            Email
          </label>
          <input
            id="guest-email"
            type="email"
            value={guestInfo.email}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 outline-none transition-all"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="guest-phone" className="block text-sm text-gray-500 mb-1">
            Teléfono
          </label>
          <input
            id="guest-phone"
            type="tel"
            value={guestInfo.phone}
            onChange={(e) => onGuestInfoChange({ ...guestInfo, phone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2dd4bf] focus:ring-2 focus:ring-[#2dd4bf]/20 outline-none transition-all"
            placeholder="+54 11 1234-5678"
          />
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={onConfirm}
        disabled={submitting || !guestInfo.name || !guestInfo.email || !guestInfo.phone}
        className={`
          w-full py-3.5 rounded-xl text-white font-semibold text-lg
          transition-all duration-200
          ${submitting || !guestInfo.name || !guestInfo.email || !guestInfo.phone
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#2dd4bf] hover:bg-[#2dd4bf]/90 active:scale-[0.98] shadow-lg shadow-[#2dd4bf]/25'
          }
        `}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Procesando...
          </span>
        ) : (
          'Confirmar y pagar'
        )}
      </button>
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function ReservarPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params.slug
  const preselectedServiceId = searchParams.get('serviceId')

  // State
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [services, setServices] = useState<Service[]>([])

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; name: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  // Fetch services on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        const res = await fetch(`/api/services?slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error ?? 'Error al cargar servicios')
        }
        const data = await res.json() as { tenant: TenantInfo; services: Service[] }
        setTenant(data.tenant)
        setServices(data.services)

        // Pre-select service if provided via searchParams
        if (preselectedServiceId) {
          const found = data.services.find((s) => s.id === preselectedServiceId)
          if (found) {
            setSelectedService(found)
            setStep(2)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [slug, preselectedServiceId])

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedProvider || !selectedService) return

    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedTime(null)
      try {
        const res = await fetch(
          `/api/slots?providerId=${encodeURIComponent(selectedProvider!.id)}&serviceId=${encodeURIComponent(selectedService!.id)}&date=${encodeURIComponent(selectedDate!)}`
        )
        if (!res.ok) {
          throw new Error('Error al cargar horarios')
        }
        const data = await res.json() as Slot[]
        setSlots(data)
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, selectedProvider, selectedService])

  // Get unique providers for selected service
  const getProviders = useCallback((): { id: string; name: string }[] => {
    if (!selectedService) return []

    // If the service has a specific provider, return just that one
    if (selectedService.providerId && selectedService.providerName) {
      return [{ id: selectedService.providerId, name: selectedService.providerName }]
    }

    // Otherwise, collect unique providers from all services in the tenant
    const providerMap = new Map<string, string>()
    for (const s of services) {
      if (s.providerId && s.providerName) {
        providerMap.set(s.providerId, s.providerName)
      }
    }
    return Array.from(providerMap, ([id, name]) => ({ id, name }))
  }, [selectedService, services])

  // Handlers
  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    setSelectedProvider(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setSlots([])

    // Auto-advance if single provider
    const providers = (() => {
      if (service.providerId && service.providerName) {
        return [{ id: service.providerId, name: service.providerName }]
      }
      const providerMap = new Map<string, string>()
      for (const s of services) {
        if (s.providerId && s.providerName) {
          providerMap.set(s.providerId, s.providerName)
        }
      }
      return Array.from(providerMap, ([id, name]) => ({ id, name }))
    })()

    if (providers.length === 1) {
      setSelectedProvider(providers[0])
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const handleSelectProvider = (provider: { id: string; name: string }) => {
    setSelectedProvider(provider)
    setSelectedDate(null)
    setSelectedTime(null)
    setSlots([])
    setStep(3)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleSelectTime = (time: string) => {
    setSelectedTime(time)
    setStep(4)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleConfirm = async () => {
    if (!selectedService || !selectedProvider || !selectedTime || !tenant) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          serviceId: selectedService.id,
          providerId: selectedProvider.id,
          startsAt: selectedTime,
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error al crear la reserva')
      }

      const data = await res.json() as { initPoint?: string; appointmentId?: string }

      if (data.initPoint) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.initPoint
      } else {
        // Fallback: redirect to confirmation page
        window.location.href = `/${slug}/confirmacion?appointment=${data.appointmentId ?? ''}`
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar la reserva. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant?.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="font-bold text-[#1e1b4b]">{tenant?.name}</h1>
            <p className="text-xs text-gray-400">Reservar turno</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <StepIndicator currentStep={step} />

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1e1b4b] mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        )}

        {/* Steps */}
        {step === 1 && (
          <ServiceStep
            services={services}
            selectedServiceId={selectedService?.id ?? null}
            onSelect={handleSelectService}
          />
        )}

        {step === 2 && (
          <ProviderStep
            providers={getProviders()}
            selectedProviderId={selectedProvider?.id ?? null}
            onSelect={handleSelectProvider}
          />
        )}

        {step === 3 && (
          <DateTimeStep
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            slots={slots}
            loadingSlots={loadingSlots}
            onSelectDate={handleSelectDate}
            onSelectTime={handleSelectTime}
          />
        )}

        {step === 4 && selectedService && selectedProvider && selectedTime && (
          <ConfirmStep
            service={selectedService}
            providerName={selectedProvider.name}
            selectedTime={selectedTime}
            guestInfo={guestInfo}
            onGuestInfoChange={setGuestInfo}
            onConfirm={handleConfirm}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  )
}
