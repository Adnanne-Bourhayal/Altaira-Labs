package com.altaira.backend.dto.github;

import java.util.List;
import java.util.Map;

public record GitHubIntegrationStatusResponse(
        boolean enabled,
        boolean provisioningEnabled,
        boolean dryRun,
        String org,
        boolean appConfigured,
        boolean installationIdConfigured,
        boolean installationReachable,
        GitHubRepositoriesVisible repositoriesVisible,
        Map<String, String> permissions,
        List<String> errors
) {}
