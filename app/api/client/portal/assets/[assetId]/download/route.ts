import { NextResponse } from "next/server"
import { clientBackendHeaders, getClientSessionToken } from "@/lib/server-client-auth"
import { backendServiceUnavailableResponse, backendUrl } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    assetId: string
  }>
}

export async function GET(_request: Request, { params }: Params) {
  const sessionToken = await getClientSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assetId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/client/project-assets/${assetId}/download`), {
      headers: await clientBackendHeaders(),
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Could not download project file." }, { status: response.status })
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": response.headers.get("Content-Disposition") || "attachment",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return backendServiceUnavailableResponse("Client project download service")
  }
}
