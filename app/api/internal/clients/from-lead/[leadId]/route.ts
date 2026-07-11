import { NextResponse } from "next/server"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"

type RouteContext = {
  params: Promise<{ leadId: string }>
}

export async function POST(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { leadId } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/clients/from-lead/${leadId}`), {
      method: "POST",
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client service")
  }
}
