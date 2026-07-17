import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    taskId: string
  }>
}

export async function PATCH(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { taskId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/onboarding/admin/tasks/${taskId}/approve`), {
      method: "PATCH",
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
    return backendServiceUnavailableResponse("Admin onboarding service")
  }
}
