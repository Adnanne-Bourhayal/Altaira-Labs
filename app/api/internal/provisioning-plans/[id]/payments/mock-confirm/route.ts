import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await context.params
  try {
    const response = await fetch(backendUrl(`/api/v1/provisioning-plans/${id}/payments/mock-confirm`), {
      method: "POST", headers: await adminBackendHeaders(), cache: "no-store",
    })
    return NextResponse.json(await readJson(response), { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Mock payment service")
  }
}
