package com.altaira.backend.repository;

import com.altaira.backend.entity.OnboardingAuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OnboardingAuditLogRepository extends JpaRepository<OnboardingAuditLogEntity, UUID> {
}
