import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE } from "@/lib/server-admin-auth"
import { backendUrl } from "@/lib/server-backend-api"

export async function POST() {
  const cookieStore = await cookies()

  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (sessionToken) {
    await fetch(backendUrl("/api/v1/auth/logout"), {
      method: "POST",
      headers: {
        "X-Admin-Session-Token": sessionToken,
      },
      cache: "no-store",
    }).catch(() => undefined)
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  cookieStore.set("altaira_admin_auth", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ success: true }, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
