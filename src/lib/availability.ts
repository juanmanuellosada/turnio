import { db } from '@/db'
import {
  availability,
  services,
  appointments,
  blockedSlots,
} from '@/db/schema'
import { eq, and, gte, lt, inArray } from 'drizzle-orm'
import {
  startOfDay,
  addMinutes,
  addDays,
  areIntervalsOverlapping,
} from 'date-fns'

interface GetAvailableSlotsParams {
  providerId: string
  serviceId: string
  date: Date
}

interface Slot {
  startsAt: Date
  endsAt: Date
  available: boolean
}

/**
 * Parses a time string like "09:00" or "09:00:00" and returns
 * a Date on the given day with those hours/minutes set (UTC).
 */
function parseTimeOnDate(timeStr: string, day: Date): Date {
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const result = startOfDay(day)
  result.setUTCHours(hours, minutes, 0, 0)
  return result
}

export async function getAvailableSlots({
  providerId,
  serviceId,
  date,
}: GetAvailableSlotsParams): Promise<Slot[]> {
  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)
  const dayOfWeek = date.getUTCDay() // 0=Sunday, 6=Saturday

  // 1. Get provider availability windows for this day of week
  const availabilityWindows = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.providerId, providerId),
        eq(availability.dayOfWeek, dayOfWeek),
        eq(availability.isActive, true)
      )
    )

  if (availabilityWindows.length === 0) {
    return []
  }

  // 2. Get service duration
  const [service] = await db
    .select({ durationMinutes: services.durationMinutes })
    .from(services)
    .where(eq(services.id, serviceId))

  if (!service) {
    return []
  }

  const { durationMinutes } = service

  // 3. Query existing appointments for this provider on this date
  const existingAppointments = await db
    .select({
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.providerId, providerId),
        gte(appointments.startsAt, dayStart),
        lt(appointments.startsAt, dayEnd),
        inArray(appointments.status, ['pending', 'confirmed'])
      )
    )

  // 4. Query blocked slots for this provider overlapping this date
  const existingBlockedSlots = await db
    .select({
      startsAt: blockedSlots.startsAt,
      endsAt: blockedSlots.endsAt,
    })
    .from(blockedSlots)
    .where(
      and(
        eq(blockedSlots.providerId, providerId),
        lt(blockedSlots.startsAt, dayEnd),
        gte(blockedSlots.endsAt, dayStart)
      )
    )

  // 5. Generate slots from each availability window
  const slots: Slot[] = []

  for (const window of availabilityWindows) {
    const windowStart = parseTimeOnDate(window.startTime, dayStart)
    const windowEnd = parseTimeOnDate(window.endTime, dayStart)

    let slotStart = windowStart
    while (addMinutes(slotStart, durationMinutes) <= windowEnd) {
      const slotEnd = addMinutes(slotStart, durationMinutes)
      const slotInterval = { start: slotStart, end: slotEnd }

      // Check overlap with existing appointments
      const overlapsAppointment = existingAppointments.some((appt) =>
        areIntervalsOverlapping(slotInterval, {
          start: appt.startsAt,
          end: appt.endsAt,
        })
      )

      // Check overlap with blocked slots
      const overlapsBlocked = existingBlockedSlots.some((blocked) =>
        areIntervalsOverlapping(slotInterval, {
          start: blocked.startsAt,
          end: blocked.endsAt,
        })
      )

      slots.push({
        startsAt: slotStart,
        endsAt: slotEnd,
        available: !overlapsAppointment && !overlapsBlocked,
      })

      slotStart = slotEnd
    }
  }

  // Sort slots by start time
  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  return slots
}
