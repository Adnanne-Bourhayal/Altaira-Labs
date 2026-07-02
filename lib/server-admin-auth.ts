import { cookies } from "next/headers"

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  return cookieStore.get("altaira_admin_auth")?.value === "true"
}
