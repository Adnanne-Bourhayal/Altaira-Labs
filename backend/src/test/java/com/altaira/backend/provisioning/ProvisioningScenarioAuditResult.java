package com.altaira.backend.provisioning;

import java.util.List;

record ProvisioningScenarioAuditResult(
        ProvisioningAuditScenario scenario,
        List<String> actualRequirements,
        String actualRoute,
        List<String> actualTracks,
        List<String> actualRuleIds,
        List<String> actualSharedResources,
        List<String> actualIncludedTools,
        List<String> actualExcludedTools,
        String actualAutomationLevel,
        List<String> actualManualSteps,
        List<String> actualRisks,
        List<String> mismatches
) {
    boolean passes() {
        return mismatches.isEmpty();
    }
}
