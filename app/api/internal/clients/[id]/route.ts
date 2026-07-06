import { NextResponse } from "next/server"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"
import { isAdminAuthenticated } from "@/lib/server-admin-auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/clients/${id}`), {
      headers: {
        "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
      },
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Client service")
  }
}
