import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}
