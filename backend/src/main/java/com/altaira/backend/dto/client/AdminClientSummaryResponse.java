package com.altaira.backend.dto.client;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminClientSummaryResponse(
        UUID id,
        String name,
        String company,
        String email,
        String phone,
        UUID sourceLeadId,
        String status,
        String sectorType,
        List<String> activeServices,
        int projectCount,
        int openTaskCount,
        String nextAction,
        String nextActionStatus,
        String nextActionOwnerRole,
        Instant nextActionDueAt,
        String overallState,
        Instant lastActivityAt,
        boolean workspaceAvailable,
        Instant createdAt,
        Instant updatedAt
) {
}
