import { ClientWorkspaceShell } from "@/components/workspace/ClientWorkspaceShell"

export const metadata = {
  title: "Client Workspace | Altaira Labs",
  description: "Private Altaira Labs client workspace.",
  robots: {
    index: false,
    follow: false,
  },
}

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{
    clientId?: string
    preview?: string
  }>
}

export default async function WorkspacePage({
  params,
  searchParams,
}: WorkspacePageProps) {
  const { workspaceId } = await params
  const query = await searchParams

  return (
    <ClientWorkspaceShell
      workspaceId={workspaceId}
      clientId={query.clientId}
      preview={query.preview === "1"}
    />
  )
}
