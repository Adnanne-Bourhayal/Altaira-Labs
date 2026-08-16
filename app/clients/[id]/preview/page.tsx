import { WorkspaceResolver } from "@/components/workspace/WorkspaceResolver"

export const metadata = {
  title: "Client Preview | Altaira Labs",
  robots: {
    index: false,
    follow: false,
  },
}

type AdminClientPreviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminClientPreviewPage({
  params,
}: AdminClientPreviewPageProps) {
  const { id } = await params
  return <WorkspaceResolver clientId={id} preview />
}
