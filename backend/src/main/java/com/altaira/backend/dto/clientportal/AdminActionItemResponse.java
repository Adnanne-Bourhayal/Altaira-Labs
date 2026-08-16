package com.altaira.backend.dto.clientportal;

import java.time.Instant;
import java.util.UUID;

public record AdminActionItemResponse(
        UUID sourceId,
        String actionType,
        String title,
        UUID clientId,
        String clientName,
        String clientCompany,
        UUID projectId,
        String projectName,
        String serviceKey,
        String serviceName,
        boolean critical,
        Instant actionAt
) {
}
