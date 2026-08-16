import { cookies } from "next/headers"

export const CLIENT_SESSION_COOKIE = "altaira_client_session"

export async function getClientSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(CLIENT_SESSION_COOKIE)?.value || ""
}

export async function clientBackendHeaders(extraHeaders: Record<string, string> = {}) {
  const sessionToken = await getClientSessionToken()
  const headers: Record<string, string> = {
    ...extraHeaders,
  }

  if (sessionToken) {
    headers["X-Client-Session-Token"] = sessionToken
  }

  return headers
}
