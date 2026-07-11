import { NextResponse } from "next/server"
import { backendUrl, leadServiceUnavailableResponse, readJson } from "@/lib/server-backend-api"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(backendUrl("/api/v1/leads"), {
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })

    const data = await readJson(response)

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch {
    return leadServiceUnavailableResponse()
  }
}
