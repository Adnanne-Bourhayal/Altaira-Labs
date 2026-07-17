import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Client project update must be valid JSON.")
  }

  const { projectId } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/admin/projects/${projectId}`), {
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
    return backendServiceUnavailableResponse("Admin client project service")
  }
}
