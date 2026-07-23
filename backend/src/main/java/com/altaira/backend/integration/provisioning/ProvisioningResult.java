package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.ProvisioningStepStatus;

import java.util.Map;

public record ProvisioningResult(
        ProvisioningStepStatus status,
        boolean manualActionRequired,
        String safeError,
        String externalResourceId,
        String externalUrl,
        Map<String, Object> inputSummary
) {
    public ProvisioningResult {
        inputSummary = inputSummary == null ? Map.of() : Map.copyOf(inputSummary);
    }

    public static ProvisioningResult dryRun(ProvisioningRequest request) {
        return new ProvisioningResult(
                ProvisioningStepStatus.DRY_RUN,
                false,
                null,
                null,
                null,
                request.inputSummary()
        );
    }

    public static ProvisioningResult blocked(ProvisioningRequest request) {
        return new ProvisioningResult(
                ProvisioningStepStatus.BLOCKED,
                true,
                request.missingCredentialsMessage(),
                null,
                null,
                request.inputSummary()
        );
    }

    public static ProvisioningResult unregistered(ProvisioningRequest request) {
        return new ProvisioningResult(
                ProvisioningStepStatus.DRY_RUN,
                true,
                "No execution adapter is registered; admin review is required before provisioning.",
                null,
                null,
                request.inputSummary()
        );
    }
}
