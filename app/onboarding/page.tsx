import { WorkspaceResolver } from "@/components/workspace/WorkspaceResolver"

export const metadata = {
  title: "Onboarding | Altaira Labs",
  description: "Private client onboarding workspace for Altaira Labs.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingPage() {
  return <WorkspaceResolver tab="onboarding" />
}
