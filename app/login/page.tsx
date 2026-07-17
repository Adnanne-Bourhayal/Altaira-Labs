import { redirect } from "next/navigation"

export const metadata = {
  title: "Login | Altaira Labs",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LegacyLoginRedirectPage() {
  redirect("/admin/login")
}
