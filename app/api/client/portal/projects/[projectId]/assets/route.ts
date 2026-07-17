import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(_request: Request, { params }: Params) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/client/projects/${projectId}/assets`), {
      headers: await clientBackendHeaders(),
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
    return backendServiceUnavailableResponse("Client project asset service")
  }
}

export async function POST(request: Request, { params }: Params) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const formData = await request.formData()

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/client/projects/${projectId}/assets`), {
      method: "POST",
      headers: await clientBackendHeaders(),
      body: formData,
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
    return backendServiceUnavailableResponse("Client project asset service")
  }
}
