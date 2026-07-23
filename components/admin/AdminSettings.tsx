"use client"

import { useEffect, useState } from "react"
import { Check, Laptop, Moon, PanelLeftClose, PanelLeftOpen, ShieldCheck, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { AdminShell } from "@/components/admin/AdminShell"
import {
  readAdminSidebarCollapsed,
  writeAdminSidebarCollapsed,
} from "@/lib/admin-preferences"
import { cn } from "@/lib/utils"

type ThemeOption = {
  value: "light" | "dark" | "system"
  label: string
  description: string
  icon: typeof Sun
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    description: "Clear workspace with dark navigation.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Reduced glare for low-light work.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow this device automatically.",
    icon: Laptop,
  },
]

export function AdminSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSidebarCollapsed(readAdminSidebarCollapsed())
  }, [])

  const updateSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    writeAdminSidebarCollapsed(collapsed)
  }

  return (
    <AdminShell>
      <main className="min-h-[calc(100vh-5rem)] bg-[#f4f4f4] px-5 py-8 dark:bg-[#161616] md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <header className="border-b border-[#c6c6c6] pb-7 dark:border-[#525252]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f62fe]">
              Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#161616] dark:text-white">
              Workspace preferences
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#525252] dark:text-[#c6c6c6]">
              Configure how the admin workspace appears on this device.
            </p>
          </header>

          <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <section aria-labelledby="appearance-heading">
                <div className="mb-4">
                  <h2
                    id="appearance-heading"
                    className="text-lg font-semibold text-[#161616] dark:text-white"
                  >
                    Appearance
                  </h2>
                  <p className="mt-1 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                    Choose the interface mode used across the workspace.
                  </p>
                </div>

                <div className="grid border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626] md:grid-cols-3">
                  {themeOptions.map((option, index) => {
                    const Icon = option.icon
                    const active = mounted && theme === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "relative min-h-40 border-b border-[#c6c6c6] p-5 text-left transition-colors hover:bg-[#f4f4f4] dark:border-[#525252] dark:hover:bg-[#393939] md:border-b-0",
                          index < themeOptions.length - 1 && "md:border-r",
                          active && "bg-[#e8f1ff] dark:bg-[#0b2f6b]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <Icon className="h-5 w-5 text-[#0f62fe]" aria-hidden="true" />
                          {active && (
                            <span className="grid h-6 w-6 place-items-center bg-[#0f62fe] text-white">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <p className="mt-7 text-base font-semibold text-[#161616] dark:text-white">
                          {option.label}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[#6f6f6f] dark:text-[#c6c6c6]">
                          {option.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section aria-labelledby="navigation-heading">
                <div className="mb-4">
                  <h2
                    id="navigation-heading"
                    className="text-lg font-semibold text-[#161616] dark:text-white"
                  >
                    Navigation
                  </h2>
                  <p className="mt-1 text-sm text-[#6f6f6f] dark:text-[#a8a8a8]">
                    This preference is remembered in this browser.
                  </p>
                </div>

                <div className="grid border border-[#c6c6c6] bg-white dark:border-[#525252] dark:bg-[#262626] md:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={!sidebarCollapsed}
                    onClick={() => updateSidebar(false)}
                    className={cn(
                      "min-h-32 border-b border-[#c6c6c6] p-5 text-left transition-colors hover:bg-[#f4f4f4] dark:border-[#525252] dark:hover:bg-[#393939] md:border-b-0 md:border-r",
                      !sidebarCollapsed && "bg-[#e8f1ff] dark:bg-[#0b2f6b]"
                    )}
                  >
                    <PanelLeftOpen className="h-5 w-5 text-[#0f62fe]" aria-hidden="true" />
                    <p className="mt-5 font-semibold text-[#161616] dark:text-white">Expanded</p>
                    <p className="mt-1 text-sm text-[#6f6f6f] dark:text-[#c6c6c6]">
                      Keep section labels visible.
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-pressed={sidebarCollapsed}
                    onClick={() => updateSidebar(true)}
                    className={cn(
                      "min-h-32 p-5 text-left transition-colors hover:bg-[#f4f4f4] dark:hover:bg-[#393939]",
                      sidebarCollapsed && "bg-[#e8f1ff] dark:bg-[#0b2f6b]"
                    )}
                  >
                    <PanelLeftClose className="h-5 w-5 text-[#0f62fe]" aria-hidden="true" />
                    <p className="mt-5 font-semibold text-[#161616] dark:text-white">Compact</p>
                    <p className="mt-1 text-sm text-[#6f6f6f] dark:text-[#c6c6c6]">
                      Use icons to leave more room for work.
                    </p>
                  </button>
                </div>
              </section>
            </div>

            <aside className="h-fit bg-[#161616] p-6 text-white" aria-labelledby="security-heading">
              <ShieldCheck className="h-6 w-6 text-[#78a9ff]" aria-hidden="true" />
              <h2 id="security-heading" className="mt-5 text-lg font-semibold">
                Configuration boundary
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Appearance preferences stay in this browser. Passwords, roles, integrations and
                billing settings remain server-managed and are never stored here.
              </p>
              <dl className="mt-6 divide-y divide-white/15 border-y border-white/15 text-sm">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-white/55">Theme</dt>
                  <dd className="font-medium text-white">Available</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-white/55">Navigation layout</dt>
                  <dd className="font-medium text-white">Available</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-white/55">Roles and integrations</dt>
                  <dd className="font-medium text-white/45">Not configured</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}
