package com.altaira.backend.service;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.SecurityEventEntity;
import com.altaira.backend.model.SecurityEventType;
import com.altaira.backend.repository.SecurityEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecurityEventService {

    private final SecurityEventRepository securityEventRepository;

    public SecurityEventService(SecurityEventRepository securityEventRepository) {
        this.securityEventRepository = securityEventRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            SecurityEventType eventType,
            AppUserEntity user,
            String username,
            boolean success,
            String ipAddress,
            String userAgent,
            String metadata
    ) {
        SecurityEventEntity event = new SecurityEventEntity();
        event.setEventType(eventType.value());
        event.setUser(user);
        event.setUsername(normalizeOptional(username));
        event.setSuccess(success);
        event.setIpAddress(trimToLimit(ipAddress, 80));
        event.setUserAgent(trimToLimit(userAgent, 500));
        event.setMetadata(trimToLimit(metadata, 1000));
        securityEventRepository.save(event);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String trimToLimit(String value, int limit) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.length() <= limit ? trimmed : trimmed.substring(0, limit);
    }
}
