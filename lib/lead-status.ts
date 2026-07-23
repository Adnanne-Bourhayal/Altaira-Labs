export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost" | "closed"

export const LEAD_STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "closed", label: "Archived" },
]

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUS_OPTIONS.some((status) => status.value === value)
}

export function statusLabel(value: string) {
  const status = LEAD_STATUS_OPTIONS.find((option) => option.value === value)
  return status?.label || value
}

export function statusBadgeClass(value: string) {
  if (value === "converted") return "border-emerald-700/30 bg-emerald-950/20 text-emerald-300"
  if (value === "lost" || value === "closed") return "border-white/10 bg-white/[0.03] text-white/45"
  if (value === "qualified") return "border-[#0f62fe]/40 bg-[#0f62fe]/10 text-blue-200"
  return "border-white/10 bg-white/[0.03] text-white/70"
}
