import ClientOnboardingWorkspace from "@/components/onboarding/ClientOnboardingWorkspace"

export const metadata = {
  title: "Onboarding | Altaira Labs",
  description: "Private client onboarding workspace for Altaira Labs.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingPage() {
  return <ClientOnboardingWorkspace />
}
