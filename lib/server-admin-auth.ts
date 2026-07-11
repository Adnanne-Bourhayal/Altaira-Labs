import { cookies } from "next/headers"
import { backendUrl } from "@/lib/server-backend-api"

export const ADMIN_SESSION_COOKIE = "altaira_admin_session"

export async function isAdminAuthenticated() {
  const sessionToken = await getAdminSessionToken()

  if (!sessionToken) {
    return false
  }

  try {
    const response = await fetch(backendUrl("/api/v1/auth/me"), {
      headers: {
        "X-Admin-Session-Token": sessionToken,
      },
      cache: "no-store",
    })

    return response.ok
  } catch {
    return false
  }
}

export async function getAdminSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || ""
}

export async function adminBackendHeaders(extraHeaders: Record<string, string> = {}) {
  const sessionToken = await getAdminSessionToken()
  const headers: Record<string, string> = {
    ...extraHeaders,
  }

  if (sessionToken) {
    headers["X-Admin-Session-Token"] = sessionToken
  }

  if (process.env.INTERNAL_API_TOKEN) {
    headers["X-Internal-API-Token"] = process.env.INTERNAL_API_TOKEN
  }

  return headers
}
