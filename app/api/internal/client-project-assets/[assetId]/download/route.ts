import { NextResponse } from "next/server"
import { adminBackendHeaders, isAdminAuthenticated } from "@/lib/server-admin-auth"
import { backendServiceUnavailableResponse, backendUrl, readJson } from "@/lib/server-backend-api"

type Params = {
  params: Promise<{
    assetId: string
  }>
}

export async function GET(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assetId } = await params

  try {
    const response = await fetch(backendUrl(`/api/v1/client-portal/admin/project-assets/${assetId}/download`), {
      headers: await adminBackendHeaders(),
      cache: "no-store",
    })

    if (!response.ok) {
      const data = await readJson(response)
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          "Cache-Control": "no-store",
        },
      })
    }

    const headers = new Headers()
    const contentType = response.headers.get("content-type")
    const contentLength = response.headers.get("content-length")
    const contentDisposition = response.headers.get("content-disposition")

    if (contentType) {
      headers.set("Content-Type", contentType)
    }

    if (contentLength) {
      headers.set("Content-Length", contentLength)
    }

    if (contentDisposition) {
      headers.set("Content-Disposition", contentDisposition)
    }

    headers.set("Cache-Control", "no-store")

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    })
  } catch {
    return backendServiceUnavailableResponse("Admin project asset download service")
  }
}
