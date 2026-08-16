import { WorkspaceResolver } from "@/components/workspace/WorkspaceResolver"

export const metadata = {
  title: "Client Workspace | Altaira Labs",
  robots: {
    index: false,
    follow: false,
  },
}

type AdminClientWorkspacePageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminClientWorkspacePage({
  params,
}: AdminClientWorkspacePageProps) {
  const { id } = await params
  return <WorkspaceResolver clientId={id} />
}
