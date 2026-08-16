import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    taskId: string
  }>
}

export async function PATCH(request: Request, { params }: Params) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Onboarding task submission must be valid JSON.")
  }

  const { taskId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/onboarding/client/tasks/${taskId}/submit`), {
      method: "PATCH",
      headers: await clientBackendHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return backendServiceUnavailableResponse("Client onboarding service")
  }
}
