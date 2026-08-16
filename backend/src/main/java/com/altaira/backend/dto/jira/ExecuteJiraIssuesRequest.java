package com.altaira.backend.dto.jira;

import jakarta.validation.constraints.NotBlank;

public record ExecuteJiraIssuesRequest(@NotBlank String confirmation) {
}
