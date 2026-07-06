import { NextResponse } from "next/server"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"
import { isAdminAuthenticated } from "@/lib/server-admin-auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Client service status update must be valid JSON.")
  }

  try {
    const response = await fetch(backendUrl(`/api/v1/client-services/${id}/status`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client service assignment")
  }
}
