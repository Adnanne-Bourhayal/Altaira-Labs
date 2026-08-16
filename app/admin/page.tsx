import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/AdminDashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard | Altaira Labs",
  description: "Altaira Labs internal project and client operations dashboard.",
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
