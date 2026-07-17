import ClientLoginPreview from "@/components/auth/ClientLoginPreview"

export const metadata = {
  title: "Client Area | Altaira Labs",
  description: "Prepared client workspace access page for Altaira Labs customers.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ClientAreaPage() {
  return <ClientLoginPreview />
}
