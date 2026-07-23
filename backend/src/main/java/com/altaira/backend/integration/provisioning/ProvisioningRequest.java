package com.altaira.backend.integration.provisioning;

import java.util.Map;

public record ProvisioningRequest(
        String trackKey,
        String action,
        Map<String, Object> inputSummary,
        boolean credentialsConfigured,
        boolean blockWhenCredentialsMissing,
        String missingCredentialsMessage
) {
    public ProvisioningRequest {
        inputSummary = inputSummary == null ? Map.of() : Map.copyOf(inputSummary);
    }
}
