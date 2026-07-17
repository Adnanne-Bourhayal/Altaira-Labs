import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { CLIENT_SESSION_COOKIE } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Invitation activation request must be valid JSON.")
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalidJsonResponse("Invitation activation request must include token and password.")
  }

  try {
    const response = await fetch(backendUrl("/api/v1/client-invitations/accept"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await readJson(response)

    if (!response.ok || !data || Array.isArray(data) || typeof data.sessionToken !== "string") {
      return NextResponse.json(data, { status: response.status })
    }

    const user = data.user
    const role = user && typeof user === "object" && "role" in user ? String(user.role) : ""

    if (role !== "client_user" && role !== "viewer") {
      return NextResponse.json({ error: "Client role required" }, { status: 403 })
    }

    const maxAge = typeof data.expiresAt === "string"
      ? Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      : 60 * 60 * 8

    const cookieStore = await cookies()
    cookieStore.set(CLIENT_SESSION_COOKIE, data.sessionToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    })

    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch {
    return backendServiceUnavailableResponse("Client invitation service")
  }
}
