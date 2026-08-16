import { WorkspaceResolver } from "@/components/workspace/WorkspaceResolver"

export const metadata = {
  title: "Client Dashboard | Altaira Labs",
  description: "Private Altaira Labs client dashboard.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ClientDashboardPage() {
  return <WorkspaceResolver tab="summary" />
}
