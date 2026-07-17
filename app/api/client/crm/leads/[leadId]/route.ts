import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = {
  params: Promise<{ leadId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { leadId } = await context.params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-crm/client/leads/${leadId}`), {
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
    return backendServiceUnavailableResponse("Client CRM lead service")
  }
}
