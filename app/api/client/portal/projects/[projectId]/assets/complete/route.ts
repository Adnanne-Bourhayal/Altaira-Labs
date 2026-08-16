import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type Params = { params: Promise<{ projectId: string }> }

export async function POST(request: Request, { params }: Params) {
  if (!(await getClientSessionToken())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Upload confirmation must be valid JSON.")
  }

  const { projectId } = await params
  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/client/projects/${projectId}/assets/complete`), {
      method: "POST",
      headers: await clientBackendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    })
    return NextResponse.json(await readJson(response), { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client project upload confirmation service")
  }
}
