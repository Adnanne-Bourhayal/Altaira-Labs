package com.altaira.backend.integration.github;

public record GitHubRepositoryProvisioningResult(
        boolean created,
        boolean reused,
        String externalResourceId,
        String fullName,
        String externalUrl,
        String visibility
) {}
