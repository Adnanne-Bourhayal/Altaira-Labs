export type CommercialPaymentSession = {
  id: string
  providerMode: "mock" | "test"
  status: string
  amountMinor: number
  currency: string
  checkoutUrl?: string | null
  confirmedAt?: string | null
}

export type CommercialProvisioningStep = {
  id: string
  trackKey?: string | null
  provider: string
  action: string
  status: string
  manualActionRequired: boolean
  safeError?: string | null
  inputSummary: Record<string, unknown>
}

export type CommercialFlow = {
  flowId?: string | null
  planId: string
  leadId: string
  clientId?: string | null
  workspaceId?: string | null
  paymentStatus: string
  clientStatus: string
  workspaceStatus: string
  invitationStatus: string
  provisioningStatus: string
  planApproved: boolean
  testMode: boolean
  mockMode: boolean
  mockConfirmationAllowed: boolean
  executionAllowed: boolean
  paymentSession?: CommercialPaymentSession | null
  provisioningRun?: {
    id: string
    status: string
    dryRun: boolean
    steps: CommercialProvisioningStep[]
  } | null
  emailDeliveries?: {
    id: string
    emailType: string
    recipient: string
    status: string
    safeError?: string | null
    createdAt: string
    sentAt?: string | null
  }[]
  safeMessage: string
  paymentConfirmedAt?: string | null
  activatedAt?: string | null
}

export function commercialStatusLabel(value: string) {
  return value
    .replace(/^(PAYMENT|CLIENT|WORKSPACE|INVITATION|PROVISIONING)_/, "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase())
}
