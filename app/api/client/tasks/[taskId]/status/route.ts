import { NextRequest, NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ taskId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await context.params

  try {
    const body = await request.text()
    const response = await fetch(backendUrl(`/api/v1/workspace-tasks/client/${taskId}/status`), {
      method: "PATCH",
      headers: await clientBackendHeaders({ "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client task service")
  }
}
