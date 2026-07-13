package com.altaira.backend.repository;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.AppUserSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserSessionRepository extends JpaRepository<AppUserSessionEntity, UUID> {
    Optional<AppUserSessionEntity> findBySessionTokenHash(String sessionTokenHash);
    List<AppUserSessionEntity> findAllByUserAndRevokedAtIsNull(AppUserEntity user);
}
