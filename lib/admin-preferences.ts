export const ADMIN_SIDEBAR_COLLAPSED_KEY = "altaira.admin.sidebar.collapsed"
export const ADMIN_PREFERENCES_UPDATED_EVENT = "altaira:admin-preferences-updated"

export function readAdminSidebarCollapsed() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true"
}

export function writeAdminSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(collapsed))
  window.dispatchEvent(
    new CustomEvent(ADMIN_PREFERENCES_UPDATED_EVENT, {
      detail: { sidebarCollapsed: collapsed },
    })
  )
}
