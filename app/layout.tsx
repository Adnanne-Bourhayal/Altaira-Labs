import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/lib/language-context"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Altaira Labs - More Clients. Less Manual Work.",
  description:
    "Digital growth agency helping businesses grow online with websites, automation, and lead generation systems that work 24/7. Get more clients on autopilot.",
  keywords: "digital agency, lead generation, business automation, website design, booking systems, growth marketing, Belgium, Spain, Netherlands",
  authors: [{ name: "Altaira Labs" }],
  openGraph: {
    title: "Altaira Labs - More Clients. Less Manual Work.",
    description: "Digital growth agency - websites, automation & lead generation that works 24/7",
    type: "website",
  },
  generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
