import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"

export async function GET() {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(backendUrl("/api/v1/client-crm/client/leads"), {
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
    return backendServiceUnavailableResponse("Client CRM service")
  }
}

export async function POST(request: Request) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("CRM lead request must be valid JSON.")
  }

  try {
    const response = await fetch(backendUrl("/api/v1/client-crm/client/leads"), {
      method: "POST",
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
    return backendServiceUnavailableResponse("Client CRM service")
  }
}
