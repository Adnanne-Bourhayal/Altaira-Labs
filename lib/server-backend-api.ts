import { NextResponse } from "next/server"

const DEFAULT_BACKEND_URL = "http://localhost:8080"

export function backendUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL
  return `${baseUrl.replace(/\/$/, "")}${path}`
}

export async function readJson(response: Response): Promise<Record<string, unknown> | unknown[]> {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as Record<string, unknown> | unknown[]
  } catch {
    return {
      error: response.ok ? "Unexpected backend response" : response.statusText || "Backend request failed",
    }
  }
}

export function leadServiceUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Lead service unavailable",
      message: "The lead service could not be reached. Please try again in a moment.",
    },
    { status: 503 }
  )
}
