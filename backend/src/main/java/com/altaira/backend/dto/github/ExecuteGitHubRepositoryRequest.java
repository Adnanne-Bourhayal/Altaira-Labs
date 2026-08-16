package com.altaira.backend.dto.github;

import jakarta.validation.constraints.NotBlank;

public record ExecuteGitHubRepositoryRequest(
        @NotBlank(message = "confirmation is required") String confirmation
) {}
