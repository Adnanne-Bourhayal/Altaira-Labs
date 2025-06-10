import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Altaira Labs - Consultoría en IA y Automatización",
  description:
    "Ayudamos a pequeñas empresas a digitalizarse e integrar Inteligencia Artificial para mejorar su eficiencia y competitividad.",
  keywords: "inteligencia artificial, automatización, consultoría tecnológica, digitalización empresas, IA para pymes",
  authors: [{ name: "Altaira Labs" }],
  openGraph: {
    title: "Altaira Labs - Consultoría en IA y Automatización",
    description: "Transformamos pequeñas empresas con IA y automatización",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
