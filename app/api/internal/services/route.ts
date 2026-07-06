import { NextResponse } from "next/server"
import { backendServiceUnavailableResponse, backendUrl, invalidJsonResponse, readJson } from "@/lib/server-backend-api"
import { isAdminAuthenticated } from "@/lib/server-admin-auth"

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(backendUrl("/api/v1/services"), {
      headers: {
        "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
      },
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Service catalogue")
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidJsonResponse("Service creation must be valid JSON.")
  }

  try {
    const response = await fetch(backendUrl("/api/v1/services"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await readJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Service catalogue")
  }
}
