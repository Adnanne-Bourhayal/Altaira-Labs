package com.altaira.backend.repository;

import com.altaira.backend.entity.SecurityEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SecurityEventRepository extends JpaRepository<SecurityEventEntity, UUID> {
    long countByEventType(String eventType);
}
