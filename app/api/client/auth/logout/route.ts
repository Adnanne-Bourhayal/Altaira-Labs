import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { CLIENT_SESSION_COOKIE, getClientSessionToken } from "@/lib/server-client-auth"
import { backendUrl } from "@/lib/server-backend-api"

export async function POST() {
  const sessionToken = await getClientSessionToken()

  if (sessionToken) {
    await fetch(backendUrl("/api/v1/auth/logout"), {
      method: "POST",
      headers: {
        "X-Admin-Session-Token": sessionToken,
      },
      cache: "no-store",
    }).catch(() => undefined)
  }

  const cookieStore = await cookies()
  cookieStore.set(CLIENT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}
