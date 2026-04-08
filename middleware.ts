import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/leads")
  const authCookie = request.cookies.get("altaira_admin_auth")?.value

  if (isProtectedRoute && authCookie !== "true") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/leads/:path*"],
}
