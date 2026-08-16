package com.altaira.backend.integration.jira;

public record JiraIssueProvisioningResult(
        boolean created,
        boolean reused,
        String issueId,
        String issueKey,
        String issueUrl
) {
}
