export type AdminClientSummary = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  sourceLeadId: string | null
  status: string
  sectorType: string
  activeServices: string[]
  projectCount: number
  openTaskCount: number
  nextAction: string | null
  nextActionStatus: string | null
  nextActionOwnerRole: "admin" | "client" | null
  nextActionDueAt: string | null
  overallState: string
  lastActivityAt: string | null
  workspaceAvailable: boolean
  createdAt: string
  updatedAt: string
}

export function humanizeAdminValue(value?: string | null) {
  if (!value) {
    return "Not set"
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatAdminDate(value?: string | null, includeYear = false) {
  if (!value) {
    return "No date"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "No date"
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
  }).format(date)
}
