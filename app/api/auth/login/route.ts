import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set("altaira_admin_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  })

  return NextResponse.json({ success: true })
}
