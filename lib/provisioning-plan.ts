export type ProvisioningPlanStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "provisioned"
  | "partially_completed"
  | "failed"

export type ProvisioningAutomationLevel = "A3" | "A2" | "A1" | "M"

export type ProvisioningDecisionTool = {
  key: string
  displayName: string
  selectionState: "selected" | "excluded"
  automationLevel: ProvisioningAutomationLevel
  required: boolean
  reason: string
}

export type ProvisioningTrackDecision = {
  track: "WEB" | "BOOKING" | "CRM" | "AUTOMATION" | "DASHBOARD"
  route: string
  ruleId: string
  matchedSignals: string[]
  reason: string
  confidence: number
  requiresManualDecision: boolean
  automationLevel: ProvisioningAutomationLevel
  tools: ProvisioningDecisionTool[]
  manualSteps: Array<{
    providerKey: string
    title: string
    reason: string
    required: boolean
  }>
  risks: string[]
}

export type ProvisioningSharedResource = ProvisioningDecisionTool & {
  usedByTracks: ProvisioningTrackDecision["track"][]
}

export type ProvisioningPlan = {
  id: string
  leadId: string
  assessmentId: string
  route: string
  automationLevel: ProvisioningAutomationLevel
  automationScope: string
  status: ProvisioningPlanStatus
  dryRun: boolean
  executionAllowed: boolean
  normalizedRequirements: Record<string, boolean>
  decisionReason: string
  costEstimate: string
  risks: string[]
  tools: Array<{
    id: string
    key: string
    displayName: string
    selectionState: "selected" | "excluded"
    automationLevel: ProvisioningAutomationLevel
    required: boolean
    reason: string
  }>
  items: Array<{
    id: string
    providerKey: string
    resourceType: string
    resourceName: string
    action: string
    status: string
    required: boolean
    reason: string
  }>
  manualSteps: Array<{
    id: string
    providerKey: string
    title: string
    reason: string
    required: boolean
    status: string
  }>
  externalResources: Array<{
    id: string
    providerKey: string
    resourceType: string
    externalResourceId?: string | null
    externalUrl?: string | null
    status: string
    idempotencyKey: string
  }>
  tracks?: ProvisioningTrackDecision[]
  sharedResources?: ProvisioningSharedResource[]
  createdAt: string
  updatedAt: string
}

export function provisioningRouteLabel(route: string) {
  return {
    PROVISION_WEB_STATIC: "Static website",
    PROVISION_WEB_CMS: "Managed CMS website",
    PROVISION_WEB_CUSTOM: "Custom web application",
    PROVISION_ECOMMERCE_PLATFORM: "Managed ecommerce platform",
    PROVISION_ECOMMERCE_CUSTOM: "Custom ecommerce",
    PROVISION_BOOKING_SAAS: "Managed booking platform",
    PROVISION_BOOKING_CUSTOM: "Custom booking system",
    PROVISION_CRM_ALTAIRA: "Altaira CRM",
    PROVISION_CRM_EXTERNAL: "External CRM configuration",
    PROVISION_AUTOMATION_MANAGED: "Managed automation",
    PROVISION_AUTOMATION_CUSTOM: "Custom automation",
    PROVISION_DASHBOARD_BI: "Business intelligence dashboard",
    PROVISION_DASHBOARD_CUSTOM: "Custom dashboard",
    COMPOSITE: "Composite service plan",
  }[route] ?? route
}

export function provisioningTrackLabel(track: ProvisioningTrackDecision["track"]) {
  return {
    WEB: "Web & SEO",
    BOOKING: "Booking",
    CRM: "CRM",
    AUTOMATION: "Automation",
    DASHBOARD: "Dashboard",
  }[track]
}

export function requirementLabel(key: string) {
  return key
    .replace(/^requires_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
