package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.OnboardingFileEntity;
import com.altaira.backend.entity.OnboardingTaskEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingFileRepository extends JpaRepository<OnboardingFileEntity, UUID> {
    List<OnboardingFileEntity> findAllByTaskOrderByCreatedAtAsc(OnboardingTaskEntity task);
    List<OnboardingFileEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);

    @Override
    @EntityGraph(attributePaths = {"task", "workspace", "client"})
    Optional<OnboardingFileEntity> findById(UUID id);
}
