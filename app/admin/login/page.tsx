import AdminLoginPanel from "@/components/auth/AdminLoginPanel"

export const metadata = {
  title: "Admin Login | Altaira Labs",
  description: "Internal admin login for Altaira Labs.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  return <AdminLoginPanel />
}
