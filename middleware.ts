import { auth } from './auth'
import { NextResponse } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  '/super-admin': ['super_admin'],
  '/admin': ['admin', 'super_admin'],
  '/agenda': ['provider', 'admin', 'super_admin'],
  '/mis-turnos': ['client'],
  '/dashboard': ['client', 'provider', 'admin', 'super_admin'],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const entry = Object.entries(ROLE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  )

  if (entry) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!entry[1].includes(session.user.role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/agenda/:path*',
    '/mis-turnos/:path*',
    '/super-admin/:path*',
  ],
}
