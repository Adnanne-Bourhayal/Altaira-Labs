"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { useTheme } from "next-themes"
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageOpen,
  Settings,
  Sun,
  Users,
  UserRoundSearch,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ADMIN_PREFERENCES_UPDATED_EVENT,
  readAdminSidebarCollapsed,
  writeAdminSidebarCollapsed,
} from "@/lib/admin-preferences"

type AdminShellProps = {
  children: ReactNode
  search?: string
  onSearchChange?: (value: string) => void
}

type NavigationItem = {
  label: string
  href?: string
  icon: typeof LayoutDashboard
  children?: Array<{ label: string; href: string }>
}

const navigation: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "Tasks", href: "/admin/tasks", icon: FileText },
      { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        label: "Leads",
        icon: UserRoundSearch,
        children: [
          { label: "Inbox", href: "/leads" },
          { label: "New intake", href: "/leads/new" },
        ],
      },
      { label: "Clients", href: "/clients", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [{ label: "Services", href: "/admin/services", icon: PackageOpen }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
]

export function AdminShell({ children, search = "", onSearchChange }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [leadsOpen, setLeadsOpen] = useState(() => pathname.startsWith("/leads"))

  useEffect(() => {
    setMounted(true)
    setCollapsed(readAdminSidebarCollapsed())

    const syncPreferences = (event: Event) => {
      const detail = (event as CustomEvent<{ sidebarCollapsed?: boolean }>).detail
      if (typeof detail?.sidebarCollapsed === "boolean") {
        setCollapsed(detail.sidebarCollapsed)
      }
    }

    window.addEventListener(ADMIN_PREFERENCES_UPDATED_EVENT, syncPreferences)
    return () => window.removeEventListener(ADMIN_PREFERENCES_UPDATED_EVENT, syncPreferences)
  }, [])

  const routeIsActive = (href?: string) => {
    if (!href) return false
    if (href === "/leads") {
      return pathname === "/leads" || /^\/leads\/(?!new(?:\/|$))/.test(pathname)
    }
    return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
  }
  const currentSection =
    navigation
      .flatMap((section) => section.items)
      .find((item) => routeIsActive(item.href) || item.children?.some((child) => routeIsActive(child.href)))?.label ?? "Workspace"

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  const toggleSidebar = () => {
    const next = !collapsed
    setCollapsed(next)
    writeAdminSidebarCollapsed(next)
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#161616] dark:bg-[#161616] dark:text-[#f4f4f4]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[#393939] bg-[#161616] text-white transition-transform duration-200",
          collapsed && "lg:w-[80px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#393939] px-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="Altaira Labs dashboard">
            <Image
              src="/brand/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain brightness-0 invert"
            />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[0.16em] text-white">
                  ALTAIRA LABS
                </p>
                <p className="mt-0.5 text-xs text-white/45">Admin workspace</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center border border-white/15 text-white/70 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
          {navigation.map((section) => (
            <div key={section.label} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = routeIsActive(item.href) || Boolean(item.children?.some((child) => routeIsActive(child.href)))
                  const content = (
                    <>
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )

                  if (item.children) {
                    return (
                      <div key={item.label}>
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed) {
                              router.push("/leads")
                              return
                            }
                            setLeadsOpen((current) => !current)
                          }}
                          title={collapsed ? item.label : undefined}
                          aria-expanded={leadsOpen}
                          className={cn(
                            "flex h-11 w-full items-center gap-3 border-l-2 px-3 text-sm font-medium transition-colors",
                            active
                              ? "border-[#0f62fe] bg-[#262626] text-white"
                              : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white"
                          )}
                        >
                          {content}
                          {!collapsed && (
                            <ChevronDown
                              className={cn("ml-auto h-4 w-4 transition-transform", leadsOpen && "rotate-180")}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        {!collapsed && leadsOpen && (
                          <div className="ml-[31px] border-l border-[#393939] py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={routeIsActive(child.href) ? "page" : undefined}
                                className={cn(
                                  "block px-4 py-2 text-sm transition-colors",
                                  routeIsActive(child.href)
                                    ? "text-white"
                                    : "text-white/45 hover:text-white"
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition-colors",
                        active
                          ? "border-[#0f62fe] bg-[#262626] text-white"
                          : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#393939] p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className="flex h-11 w-full items-center gap-3 px-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-4 top-[92px] hidden h-8 w-8 place-items-center border border-[#393939] bg-[#262626] text-white/60 shadow-sm lg:grid"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <div className={cn("min-h-screen transition-[padding] duration-200 lg:pl-[264px]", collapsed && "lg:pl-[80px]")}>
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-[#393939] bg-[#161616] px-4 text-white md:px-7">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center border border-white/15 text-white/70 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            {onSearchChange ? (
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search workspace"
                className="h-10 w-full max-w-md border border-[#393939] bg-[#262626] px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#0f62fe]"
                aria-label="Search workspace"
              />
            ) : (
              <p className="text-sm font-medium text-white/60">Admin / {currentSection}</p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="grid h-10 w-10 place-items-center border border-[#393939] text-white/65 transition hover:bg-[#262626] hover:text-white"
              aria-label={mounted && resolvedTheme === "dark" ? "Use light mode" : "Use dark mode"}
              title={mounted && resolvedTheme === "dark" ? "Use light mode" : "Use dark mode"}
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <div className="hidden h-10 items-center gap-3 border-l border-[#393939] pl-3 sm:flex">
              <div className="grid h-9 w-9 place-items-center bg-[#f4f4f4]">
                <Image
                  src="/brand/favicon.png"
                  alt="Altaira Admin"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">Altaira Admin</p>
                <p className="text-xs text-white/45">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
