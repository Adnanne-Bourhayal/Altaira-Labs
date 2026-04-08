import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error || "Failed to submit form",
          message: data?.message || "Failed to submit form",
          fields: data?.fields || null,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 }
    )
  }
}
