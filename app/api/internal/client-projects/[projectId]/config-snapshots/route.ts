import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/admin/projects/${projectId}/config-snapshots`), {
      headers: await adminBackendHeaders(),
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
    return backendServiceUnavailableResponse("Admin project configuration snapshot service")
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Configuration snapshot must be valid JSON.")
  }

  const { projectId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/admin/projects/${projectId}/config-snapshots`), {
      method: "POST",
      headers: await adminBackendHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Admin project configuration snapshot service")
  }
}
