import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/clients/${id}/admin-summary`), {
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return backendServiceUnavailableResponse("Client summary service")
  }
}
