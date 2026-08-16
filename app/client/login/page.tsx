import ClientLoginPreview from "@/components/auth/ClientLoginPreview"

export const metadata = {
  title: "Client Login | Altaira Labs",
  description: "Prepared private client workspace login for Altaira Labs customers.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ClientLoginPage() {
  return <ClientLoginPreview />
}
