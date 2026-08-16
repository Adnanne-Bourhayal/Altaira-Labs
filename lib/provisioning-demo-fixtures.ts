import asesoriaHispana from "@/lib/provisioning-demo-snapshots/asesoria-hispana.json"
import hispanoMotors from "@/lib/provisioning-demo-snapshots/hispano-motors.json"
import iberiaDental from "@/lib/provisioning-demo-snapshots/iberia-dental.json"
import tapasBistro from "@/lib/provisioning-demo-snapshots/tapas-bistro.json"
import type { ProvisioningPlan, ProvisioningTrackDecision } from "@/lib/provisioning-plan"

export type ProvisioningDemoFixture = {
  schemaVersion: 1
  scenarioId: string
  slug: string
  name: string
  sector: string
  expectedTracks: ProvisioningTrackDecision["track"][]
  plan: ProvisioningPlan
}

const snapshots = [iberiaDental, hispanoMotors, tapasBistro, asesoriaHispana]

export const provisioningDemoFixtures = snapshots.map((snapshot) => {
  if (snapshot.schemaVersion !== 1 || !snapshot.plan.dryRun || snapshot.plan.executionAllowed) {
    throw new Error(`Unsafe or unsupported provisioning demo snapshot: ${snapshot.slug}`)
  }
  return snapshot as unknown as ProvisioningDemoFixture
})

export function getProvisioningDemoFixture(slug: string) {
  return provisioningDemoFixtures.find((fixture) => fixture.slug === slug)
}
