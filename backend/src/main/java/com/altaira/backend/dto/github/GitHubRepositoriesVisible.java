package com.altaira.backend.dto.github;

import java.util.List;

public record GitHubRepositoriesVisible(
        int count,
        List<GitHubRepositorySummary> repositories
) {}
