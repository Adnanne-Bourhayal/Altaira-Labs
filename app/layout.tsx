import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Altaira Labs - Get More Clients. Automatically.",
  description:
    "We build websites and smart systems that help your business grow 24/7. Websites, booking systems & automation for local businesses.",
  keywords: "web design, booking system, automation, business website, digital agency, Belgium, Spain",
  authors: [{ name: "Altaira Labs" }],
  openGraph: {
    title: "Altaira Labs - Get More Clients. Automatically.",
    description: "Websites, booking systems & automation for local businesses",
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
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
