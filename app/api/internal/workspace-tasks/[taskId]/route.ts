import { NextRequest, NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ taskId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await context.params

  try {
    const body = await request.text()
    const response = await fetch(backendUrl(`/api/v1/workspace-tasks/admin/${taskId}`), {
      method: "PATCH",
      headers: await adminBackendHeaders({ "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Workspace task service")
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/workspace-tasks/admin/${taskId}`), {
      method: "DELETE",
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Workspace task service")
  }
}
