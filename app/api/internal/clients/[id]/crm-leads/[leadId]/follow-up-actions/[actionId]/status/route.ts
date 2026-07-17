import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ id: string; leadId: string; actionId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("CRM follow-up action status request must be valid JSON.")
  }

  const { id, leadId, actionId } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-crm/admin/clients/${id}/leads/${leadId}/follow-up-actions/${actionId}/status`), {
      method: "PATCH",
      headers: await adminBackendHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client CRM admin follow-up action service")
  }
}
