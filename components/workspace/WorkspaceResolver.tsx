"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type WorkspaceResolverProps = {
  clientId?: string
  tab?: "summary" | "company" | "services" | "onboarding" | "documents"
  preview?: boolean
}

type PortalIdentity = {
  workspaceId?: string
  client?: {
    id?: string
  }
  error?: string
  message?: string
}

export function WorkspaceResolver({
  clientId,
  tab = "summary",
  preview = false,
}: WorkspaceResolverProps) {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function resolveWorkspace() {
      const endpoint = clientId
        ? `/api/internal/client-portal/${clientId}`
        : "/api/client/portal"

      try {
        const response = await fetch(endpoint, { cache: "no-store" })
        if (response.status === 401) {
          router.replace(clientId ? "/admin/login" : "/client/login")
          return
        }

        const data = await response.json().catch(() => ({
          error: "Unexpected workspace response",
        })) as PortalIdentity

        if (!response.ok || !data.workspaceId) {
          throw new Error(data.message || data.error || "No workspace is available for this account.")
        }

        const params = new URLSearchParams({ tab })
        if (clientId) {
          params.set("clientId", clientId)
        }
        if (preview) {
          params.set("preview", "1")
        }

        if (!cancelled) {
          router.replace(`/workspace/${data.workspaceId}?${params.toString()}`)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not resolve the workspace.")
        }
      }
    }

    void resolveWorkspace()
    return () => {
      cancelled = true
    }
  }, [clientId, preview, router, tab])

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f4f4] px-6">
      <div className="max-w-xl border border-slate-200 bg-white px-7 py-6">
        {error ? (
          <>
            <p className="font-semibold text-slate-950">Workspace unavailable</p>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
          </>
        ) : (
          <div className="inline-flex items-center gap-3 text-sm text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
            Opening private workspace...
          </div>
        )}
      </div>
    </main>
  )
}
