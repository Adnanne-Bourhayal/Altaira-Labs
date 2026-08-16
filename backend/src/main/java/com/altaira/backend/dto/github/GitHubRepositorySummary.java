package com.altaira.backend.dto.github;

public record GitHubRepositorySummary(
        String name,
        String fullName,
        boolean privateRepository,
        String defaultBranch
) {}
