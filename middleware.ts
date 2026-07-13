import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = pathname.startsWith("/leads") || pathname.startsWith("/clients") || pathname === "/services"
  const authCookie = request.cookies.get("altaira_admin_session")?.value

  if (isProtectedRoute && !authCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/leads/:path*", "/clients/:path*", "/services"],
}
