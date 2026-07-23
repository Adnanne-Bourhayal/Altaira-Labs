import type { Metadata } from "next"
import { AdminProjects } from "@/components/admin/AdminProjects"

export const metadata: Metadata = {
  title: "Projects | Altaira Admin",
}

export default function AdminProjectsPage() {
  return <AdminProjects />
}
