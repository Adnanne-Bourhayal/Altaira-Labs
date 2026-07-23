package com.altaira.backend.dto.commercial;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CommercialFlowResponse(
        UUID flowId,
        UUID planId,
        UUID leadId,
        UUID clientId,
        UUID workspaceId,
        String paymentStatus,
        String clientStatus,
        String workspaceStatus,
        String invitationStatus,
        String provisioningStatus,
        boolean planApproved,
        boolean testMode,
        boolean mockMode,
        boolean mockConfirmationAllowed,
        boolean executionAllowed,
        PaymentSession paymentSession,
        ProvisioningRun provisioningRun,
        List<EmailDelivery> emailDeliveries,
        String safeMessage,
        Instant paymentConfirmedAt,
        Instant activatedAt
) {
    public record PaymentSession(
            UUID id,
            String providerMode,
            String status,
            long amountMinor,
            String currency,
            String checkoutUrl,
            Instant confirmedAt
    ) {}

    public record ProvisioningRun(
            UUID id,
            String status,
            boolean dryRun,
            List<ProvisioningStep> steps
    ) {}

    public record ProvisioningStep(
            UUID id,
            String trackKey,
            String provider,
            String action,
            String status,
            boolean manualActionRequired,
            String safeError,
            Map<String, Object> inputSummary
    ) {}

    public record EmailDelivery(
            UUID id,
            String emailType,
            String recipient,
            String status,
            String safeError,
            Instant createdAt,
            Instant sentAt
    ) {}
}
