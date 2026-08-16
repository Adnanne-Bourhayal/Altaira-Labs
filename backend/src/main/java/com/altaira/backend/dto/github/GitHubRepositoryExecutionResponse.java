package com.altaira.backend.dto.github;

import java.util.UUID;

public record GitHubRepositoryExecutionResponse(
        UUID planId,
        UUID runId,
        UUID stepId,
        String provider,
        String status,
        int attempts,
        boolean dryRun,
        boolean executionAllowed,
        boolean created,
        boolean reused,
        String externalResourceId,
        String externalUrl,
        String message
) {}
