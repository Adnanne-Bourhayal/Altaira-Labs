package com.altaira.backend.provisioning;

import java.util.List;
import java.util.Map;

public record ProvisioningAuditScenario(
        String id,
        String service,
        String name,
        boolean demo,
        String formKey,
        Map<String, Object> responses,
        List<String> recommendedServices,
        Expected expected,
        List<String> missingFormFields
) {
    public record Expected(
            List<String> requirements,
            String route,
            List<String> includedTools,
            List<String> excludedTools,
            String automationLevel,
            List<String> manualSteps,
            List<String> riskKeywords
    ) {}
}
