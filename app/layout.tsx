import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import SiteHeader from "@/components/site-header"
import SmoothScroll from "./smooth-scroll"
import ThemeToggle from "./theme-toggle"
import { SpeedInsights } from '@vercel/speed-insights/next'
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Altaira Labs - Soluciones de IA para Empresas",
  description: "Transformando negocios con soluciones innovadoras de Inteligencia Artificial",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SiteHeader />
          <SmoothScroll />
          <main>{children}</main>
          <SpeedInsights />
          <footer className="border-t py-6 md:py-0 bg-white dark:bg-slate-900 dark:border-slate-800">
            <div className="container flex flex-col md:flex-row justify-between items-center gap-4 md:h-16">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Altaira Labs. Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="#"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Privacidad
                </Link>
                <Link
                  href="#"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Términos
                </Link>
              </div>
            </div>
          </footer>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}



import './globals.css'