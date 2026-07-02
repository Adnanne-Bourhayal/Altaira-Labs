import { NextResponse } from "next/server"
import { backendUrl, leadServiceUnavailableResponse, readJson } from "@/lib/server-backend-api"
import { isAdminAuthenticated } from "@/lib/server-admin-auth"

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(backendUrl("/api/v1/leads"), {
      headers: {
        "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
      },
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
