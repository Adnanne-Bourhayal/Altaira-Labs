import { NextResponse } from "next/server"
import { adminBackendHeaders, getAdminSessionToken, isAdminRole } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

export async function GET() {
  const sessionToken = await getAdminSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(backendUrl("/api/v1/auth/me"), {
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })
    const data = await readJson(response)

    if (response.ok) {
      const role = !Array.isArray(data) && data && typeof data === "object" ? data.role : undefined

      if (!isAdminRole(role)) {
        return NextResponse.json({ error: "Admin role required" }, { status: 403 })
      }
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return backendServiceUnavailableResponse("Auth service")
  }
}
