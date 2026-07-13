export type LeadStatus = "new" | "contacted" | "closed"

export const LEAD_STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
]

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUS_OPTIONS.some((status) => status.value === value)
}

export function statusLabel(value: string) {
  const status = LEAD_STATUS_OPTIONS.find((option) => option.value === value)
  return status?.label || value
}

export function statusBadgeClass(value: string) {
  if (value === "contacted") {
    return "bg-amber-500/15 text-amber-300 border-amber-500/25"
  }

  if (value === "closed") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
  }

  return "bg-blue-500/15 text-blue-300 border-blue-500/25"
}
