import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const providerId = searchParams.get('providerId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')

  if (!providerId || !serviceId || !date) {
    return NextResponse.json(
      { error: 'Missing required query parameters: providerId, serviceId, date' },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const parsedDate = new Date(date + 'T00:00:00.000Z')
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date value' },
      { status: 400 }
    )
  }

  const slots = await getAvailableSlots({
    providerId,
    serviceId,
    date: parsedDate,
  })

  return NextResponse.json(slots)
}
