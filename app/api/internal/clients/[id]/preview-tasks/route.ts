import { NextRequest, NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import {
  backendServiceUnavailableResponse,
  backendUrl,
  readJson,
} from "@/lib/server-backend-api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const response = await fetch(
      backendUrl(`/api/v1/workspace-tasks/admin/clients/${id}/preview`),
      {
        headers: await adminBackendHeaders(),
        cache: "no-store",
      }
    )
    const data = await readJson(response)

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return backendServiceUnavailableResponse("Client preview task service")
  }
}
