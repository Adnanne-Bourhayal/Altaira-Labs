package com.altaira.backend.dto.github;

import java.util.List;
import java.util.Map;

public record GitHubProvisioningPlanResponse(
        boolean dryRun,
        boolean enabled,
        boolean provisioningEnabled,
        boolean executionAllowed,
        String org,
        String repoToCreate,
        String normalizedName,
        String visibility,
        String description,
        List<String> initialFilesProposed,
        List<String> labelsProposed,
        List<String> issuesProposed,
        List<String> risks,
        List<String> manualSteps,
        Map<String, GitHubProvisioningStepResult> preparedSteps
) {}
