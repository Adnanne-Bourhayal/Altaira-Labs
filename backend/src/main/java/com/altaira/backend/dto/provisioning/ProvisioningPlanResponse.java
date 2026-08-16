package com.altaira.backend.dto.provisioning;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ProvisioningPlanResponse(
        UUID id,
        UUID leadId,
        UUID assessmentId,
        String route,
        String automationLevel,
        String automationScope,
        String status,
        boolean dryRun,
        boolean executionAllowed,
        Map<String, Boolean> normalizedRequirements,
        String decisionReason,
        String costEstimate,
        List<String> risks,
        List<Tool> tools,
        List<PlanItem> items,
        List<ManualStep> manualSteps,
        List<ExternalResource> externalResources,
        List<Track> tracks,
        List<SharedResource> sharedResources,
        Instant createdAt,
        Instant updatedAt
) {
    public record Tool(
            UUID id,
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason
    ) {}

    public record PlanItem(
            UUID id,
            String providerKey,
            String resourceType,
            String resourceName,
            String action,
            String status,
            boolean required,
            String reason
    ) {}

    public record ManualStep(
            UUID id,
            String providerKey,
            String title,
            String reason,
            boolean required,
            String status
    ) {}

    public record ExternalResource(
            UUID id,
            String providerKey,
            String resourceType,
            String externalResourceId,
            String externalUrl,
            String status,
            String idempotencyKey
    ) {}

    public record Track(
            String track,
            String route,
            String ruleId,
            List<String> matchedSignals,
            String reason,
            double confidence,
            boolean requiresManualDecision,
            String automationLevel,
            List<DecisionTool> tools,
            List<DecisionManualStep> manualSteps,
            List<String> risks
    ) {}

    public record DecisionTool(
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason
    ) {}

    public record DecisionManualStep(
            String providerKey,
            String title,
            String reason,
            boolean required
    ) {}

    public record SharedResource(
            String key,
            String displayName,
            String selectionState,
            String automationLevel,
            boolean required,
            String reason,
            List<String> usedByTracks
    ) {}
}
