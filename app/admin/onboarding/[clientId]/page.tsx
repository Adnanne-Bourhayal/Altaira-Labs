import AdminOnboardingReview from "@/components/onboarding/AdminOnboardingReview"

export const metadata = {
  title: "Admin Onboarding Review | Altaira Labs",
  robots: {
    index: false,
    follow: false,
  },
}

type Props = {
  params: Promise<{
    clientId: string
  }>
}

export default async function AdminOnboardingReviewPage({ params }: Props) {
  const { clientId } = await params

  return <AdminOnboardingReview clientId={clientId} />
}
