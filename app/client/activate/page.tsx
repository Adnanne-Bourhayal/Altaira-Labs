import { Suspense } from "react"
import ClientInvitationActivation from "@/components/auth/ClientInvitationActivation"

export const metadata = {
  title: "Activate Client Workspace | Altaira Labs",
  description: "Activate a private Altaira Labs client workspace from a secure invitation.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ClientActivatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#050814] text-white" />}>
      <ClientInvitationActivation />
    </Suspense>
  )
}
