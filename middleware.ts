import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = pathname.startsWith("/leads") || pathname.startsWith("/clients") || (pathname.startsWith("/admin") && pathname !== "/admin/login")
  const isClientProtectedRoute =
    pathname === "/onboarding" ||
    pathname.startsWith("/client/dashboard") ||
    pathname.startsWith("/client/workspace") ||
    pathname.startsWith("/client/crm")
  const authCookie = request.cookies.get("altaira_admin_session")?.value
  const clientAuthCookie = request.cookies.get("altaira_client_session")?.value

  if (isProtectedRoute && !authCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  if (isClientProtectedRoute && !clientAuthCookie) {
    return NextResponse.redirect(new URL("/client/login", request.url))
  }

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return response
}

export const config = {
  matcher: ["/leads/:path*", "/clients/:path*", "/services", "/admin/:path*", "/client/login", "/client-area", "/login", "/onboarding", "/client/dashboard/:path*", "/client/workspace/:path*", "/client/crm/:path*"],
}
