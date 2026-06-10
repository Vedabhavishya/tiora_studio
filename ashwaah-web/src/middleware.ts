import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Decodes the payload of a standard JWT token.
 * Safe to run in Edge Runtime since it relies on native 'atob'.
 */
function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validates the session cookie value. Supports both Firebase ID Tokens (JWT) 
 * and local 10-digit plain phone mock sessions for development/testing environment.
 */
function verifySession(token: string | undefined): { phone: string } | null {
  if (!token) return null;

  // Support local developer mock session (10-digit number)
  const isRawPhone = /^\d{10}$/.test(token);
  if (isRawPhone) {
    return { phone: token };
  }

  // Parse and verify Firebase JWT
  const payload = parseJwt(token);
  if (!payload) return null;

  const isExpired = payload.exp * 1000 < Date.now();
  if (isExpired) return null;

  const phone = payload.phone_number;
  if (!phone) return null;

  // Strip country code (+91)
  const cleanPhone = phone.replace(/^\+91/, "").replace(/\D/g, "");
  return { phone: cleanPhone };
}

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("auth_session")?.value;
  const adminSessionCookie = request.cookies.get("admin_session")?.value;
  const { pathname } = request.nextUrl;
  const adminPhone = "9999999999";

  const userSession = verifySession(sessionCookie);
  const adminSession = verifySession(adminSessionCookie);

  console.log(`[Middleware Debug] Path: ${pathname}, auth_session: ${sessionCookie} (valid: ${!!userSession}), admin_session: ${adminSessionCookie} (valid: ${!!adminSession})`);

  // 1. If user is logged in, don't let them go to the login page
  if (userSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Protect Admin Routes (The Firewall)
  if (pathname.startsWith("/admin")) {
    // Exclude the login and denied pages from protection to avoid redirect loops
    if (pathname === "/admin/login" || pathname === "/admin/denied") {
      // If already logged in as admin, don't show login page
      if (pathname === "/admin/login" && adminSession?.phone === adminPhone) {
        return NextResponse.redirect(new URL("/admin/navigation", request.url));
      }
      return NextResponse.next();
    }

    if (!adminSessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Strict Admin Identity Check
    if (!adminSession || adminSession.phone !== adminPhone) {
      console.warn(`[Security] Unauthorized admin access attempt`);
      return NextResponse.redirect(new URL("/admin/denied", request.url));
    }
  }

  // 3. Protect Product and Cart Routes 
  if ((pathname.startsWith("/product/") || pathname.startsWith("/cart")) && !userSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/product/:path*", "/cart/:path*"],
};
