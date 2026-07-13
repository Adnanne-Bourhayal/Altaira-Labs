import { NextResponse } from "next/server"
import { backendUrl, invalidJsonResponse, leadServiceUnavailableResponse, readJson } from "@/lib/server-backend-api"

export async function POST(req: Request) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return invalidJsonResponse("Lead submission must be valid JSON.")
  }

  try {
    const response = await fetch(backendUrl("/api/v1/leads"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await readJson(response)

    if (!response.ok) {
      return NextResponse.json(
        {
          error: !Array.isArray(data) && data.error ? data.error : "Failed to submit form",
          message: !Array.isArray(data) && data.message ? data.message : "Failed to submit form",
          fields: !Array.isArray(data) && data.fields ? data.fields : null,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch {
    return leadServiceUnavailableResponse()
  }
}
