package com.altaira.backend.dto.github;

public record GitHubProvisioningStepResult(
        String step,
        boolean executed,
        String action,
        String reason
) {}
