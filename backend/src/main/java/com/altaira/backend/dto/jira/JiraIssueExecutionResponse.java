package com.altaira.backend.dto.jira;

import java.util.List;
import java.util.UUID;

public record JiraIssueExecutionResponse(
        UUID planId,
        UUID runId,
        String status,
        boolean dryRun,
        boolean executionAllowed,
        int created,
        int reused,
        int failed,
        List<IssueResult> issues,
        String message
) {
    public record IssueResult(
            UUID stepId,
            String track,
            String summary,
            String status,
            int attempts,
            boolean created,
            boolean reused,
            String issueKey,
            String issueUrl,
            String message
    ) {
    }
}
