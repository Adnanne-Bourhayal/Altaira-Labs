import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await context.params
  try {
    const body = await request.json()
    const response = await fetch(backendUrl(`/api/v1/provisioning-plans/${id}/payments/checkout`), {
      method: "POST",
      headers: { ...(await adminBackendHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store",
    })
    return NextResponse.json(await readJson(response), { status: response.status })
  } catch {
    return backendServiceUnavailableResponse("Stripe Checkout service")
  }
}
