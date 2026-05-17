import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths accessible without authentication (proxy lets these through)
const PUBLIC_PATHS = ['/', '/login', '/register']

// Paths where an already-authenticated user should be bounced to their portal
const AUTH_REDIRECT_PATHS = ['/login', '/register']

const ROLE_PREFIXES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/staff': ['staff', 'accountant', 'technician'],
  // Khớp director layout: admin cũng được mở portal giám đốc
  '/director': ['director', 'admin'],
  '/student': ['student'],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect role aliases to /staff portal
  if (pathname.startsWith('/technician') || pathname.startsWith('/accountant')) {
    return NextResponse.redirect(new URL('/staff', request.url))
  }

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const accessToken = request.cookies.get('accessToken')?.value

  // If user is authenticated and tries to access login/register → redirect to their portal
  // (skip '/' — page.tsx handles that itself to avoid a redirect chain)
  if (AUTH_REDIRECT_PATHS.includes(pathname) && accessToken) {
    const authStorage = request.cookies.get('auth-storage')?.value
    if (authStorage) {
      try {
        const parsed = JSON.parse(decodeURIComponent(authStorage))
        const userRole = parsed?.state?.user?.role
        if (userRole) {
          const target =
            userRole === 'director'
              ? '/director'
              : userRole === 'accountant' || userRole === 'technician'
                ? '/staff'
                : `/${userRole}`
          return NextResponse.redirect(new URL(target, request.url))
        }
      } catch {
        // ignore parse errors — let them through to login
      }
    }
  }

  if (isPublic) return NextResponse.next()

  // Not authenticated → redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access: block wrong-role access
  for (const [prefix, roles] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      const authStorage = request.cookies.get('auth-storage')?.value
      if (authStorage) {
        try {
          const parsed = JSON.parse(decodeURIComponent(authStorage))
          const userRole = parsed?.state?.user?.role
          if (userRole && !roles.includes(userRole)) {
            const target =
              userRole === 'director'
                ? '/director'
                : userRole === 'accountant' || userRole === 'technician'
                  ? '/staff'
                  : `/${userRole}`
            return NextResponse.redirect(new URL(target, request.url))
          }
        } catch {
          // ignore parse errors
        }
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
