import ClientTasks from "@/components/client/ClientTasks"

export const metadata = {
  title: "Tasks | Altaira Labs Client Area",
  description: "Private client workspace tasks.",
  robots: {
    index: false,
    follow: false,
  },
}

type PageProps = {
  searchParams: Promise<{ service?: string }>
}

export default async function ClientTasksPage({ searchParams }: PageProps) {
  const { service } = await searchParams
  return <ClientTasks initialService={service || "all"} />
}
