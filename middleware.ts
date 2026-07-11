import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const protectedPrefixes = ["/leads", "/clients", "/services"]
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))
  const authCookie = request.cookies.get("altaira_admin_session")?.value

  if (isProtectedRoute && !authCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/leads/:path*", "/clients/:path*", "/services/:path*"],
}
