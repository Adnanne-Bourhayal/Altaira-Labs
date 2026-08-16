import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type Params = { params: Promise<{ taskId: string }> }

export async function POST(request: Request, { params }: Params) {
  if (!(await getClientSessionToken())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Upload preparation must be valid JSON.")
  }

  const { taskId } = await params
  try {
    const response = await fetch(backendUrl(`/api/v1/onboarding/client/tasks/${taskId}/upload-url`), {
      method: "POST",
      headers: await clientBackendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    })
    return NextResponse.json(await readJson(response), { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client onboarding upload preparation service")
  }
}
