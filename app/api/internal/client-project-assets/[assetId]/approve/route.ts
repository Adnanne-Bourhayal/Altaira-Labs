import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    assetId: string
  }>
}

export async function PATCH(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assetId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/admin/project-assets/${assetId}/approve`), {
      method: "PATCH",
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })
    const data = await readJson(response)

    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Admin project asset review service")
  }
}
