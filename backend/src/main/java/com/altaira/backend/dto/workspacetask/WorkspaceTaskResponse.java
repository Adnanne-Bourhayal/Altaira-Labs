package com.altaira.backend.dto.workspacetask;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceTaskResponse(
        UUID id,
        UUID workspaceId,
        UUID clientId,
        String clientName,
        String clientCompany,
        UUID clientServiceId,
        String serviceKey,
        String serviceName,
        UUID projectId,
        String projectName,
        String title,
        String description,
        String status,
        String priority,
        String ownerRole,
        String visibility,
        String createdByUsername,
        Instant dueAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
