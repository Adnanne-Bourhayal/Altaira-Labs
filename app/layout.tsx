import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Altaira Labs | Digital systems for local SMEs",
  description:
    "Altaira Labs helps small businesses replace manual work with clear digital systems: websites, booking flows, dashboards, automations and client management tools.",
  keywords:
    "technology consulting for SMEs, small business automation, booking systems, management dashboards, CRM lead management, professional websites, workflow automation, Belgium SMEs, Benelux digital systems, local business software",
  authors: [{ name: "Altaira Labs" }],
  openGraph: {
    title: "Altaira Labs | Digital systems for local SMEs",
    description:
      "Practical technology systems for SMEs that want more control, less manual work and a clearer way to manage clients, services and daily operations.",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
