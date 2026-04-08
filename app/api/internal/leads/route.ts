import { NextResponse } from "next/server"

export async function GET() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads`, {
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
