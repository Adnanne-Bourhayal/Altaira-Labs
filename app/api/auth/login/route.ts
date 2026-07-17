import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, isAdminRole } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Login request must be valid JSON.")
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidJsonResponse("Login request must include username and password.")
  }

  const { username, email, password } = body as { username?: string; email?: string; password?: string }
  const loginName = username || email

  try {
    const response = await fetch(backendUrl("/api/v1/auth/admin/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: loginName,
        password,
      }),
      cache: "no-store",
    })

    const data = await readJson(response)

    if (!response.ok || !data || Array.isArray(data) || typeof data.sessionToken !== "string") {
      return NextResponse.json(data, { status: response.status })
    }

    const user = data.user
    const role = user && typeof user === "object" && "role" in user ? user.role : undefined

    if (!isAdminRole(role)) {
      await fetch(backendUrl("/api/v1/auth/logout"), {
        method: "POST",
        headers: {
          "X-Admin-Session-Token": data.sessionToken,
        },
        cache: "no-store",
      }).catch(() => undefined)

      return NextResponse.json({ error: "Admin role required" }, { status: 403 })
    }

    const maxAge = typeof data.expiresAt === "string"
      ? Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      : 60 * 60 * 8

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE, data.sessionToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    })
    cookieStore.set("altaira_admin_auth", "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })

    return NextResponse.json({
      success: true,
      user,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return backendServiceUnavailableResponse("Auth service")
  }
}
