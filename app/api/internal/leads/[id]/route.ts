import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/server-admin-auth"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads/${id}`, {
    headers: {
      "X-Internal-API-Token": process.env.INTERNAL_API_TOKEN || "",
    },
    cache: "no-store",
  })

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}
