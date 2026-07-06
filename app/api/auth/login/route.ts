import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body",
        message: "Login request must be valid JSON.",
      },
      { status: 400 }
    )
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        message: "Login request must include email and password.",
      },
      { status: 400 }
    )
  }

  const { email, password } = body as { email?: string; password?: string }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set("altaira_admin_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return NextResponse.json({ success: true })
}
