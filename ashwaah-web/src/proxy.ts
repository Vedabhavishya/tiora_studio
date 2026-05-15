import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('auth_session')?.value
  const adminSession = request.cookies.get('admin_session')?.value
  const { pathname } = request.nextUrl
  const adminPhone = '9999999999'

  // 1. If user is logged in, don't let them go to the login page
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Protect Admin Routes (The Firewall)
  if (pathname.startsWith('/admin')) {
    // Exclude the login and denied pages from protection to avoid redirect loops
    if (pathname === '/admin/login' || pathname === '/admin/denied') {
      // If already logged in as admin, don't show login page
      if (pathname === '/admin/login' && adminSession === adminPhone) {
        return NextResponse.redirect(new URL('/admin/navigation', request.url))
      }
      return NextResponse.next()
    }

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Strict Admin Identity Check
    if (adminSession !== adminPhone) {
      console.warn(`[Security] Unauthorized admin access attempt from ${adminSession}`);
      return NextResponse.redirect(new URL('/admin/denied', request.url))
    }
  }

  // 3. Protect Product and Cart Routes 
  if ((pathname.startsWith('/product/') || pathname.startsWith('/cart')) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/product/:path*', '/cart/:path*'],
}
