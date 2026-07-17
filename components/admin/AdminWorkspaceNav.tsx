import Link from "next/link"
import { cn } from "@/lib/utils"

type AdminNavKey = "leads" | "clients" | "services" | "client" | "workspace" | "onboarding" | "crm"

type AdminWorkspaceNavProps = {
  active?: AdminNavKey
  clientId?: string
  className?: string
}

export function AdminWorkspaceNav({ active, clientId, className }: AdminWorkspaceNavProps) {
  const items = [
    { key: "leads", label: "Leads", href: "/leads" },
    { key: "clients", label: "Clients", href: "/clients" },
    { key: "services", label: "Admin Services", href: "/admin/services" },
    ...(clientId
      ? [
          { key: "client", label: "Client Detail", href: `/clients/${clientId}` },
          { key: "workspace", label: "Command Center", href: `/clients/${clientId}/workspace` },
          { key: "onboarding", label: "Onboarding", href: `/admin/onboarding/${clientId}` },
          { key: "crm", label: "CRM", href: `/clients/${clientId}/crm` },
        ]
      : []),
  ] as const

  return (
    <nav className={cn("flex flex-wrap gap-2 text-sm", className)} aria-label="Admin workspace navigation">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-white/60 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
            active === item.key && "border-blue-400/40 bg-blue-500/15 text-blue-100"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
