package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.entity.ClientWorkspaceEntity;
import com.altaira.backend.entity.OnboardingTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingTaskRepository extends JpaRepository<OnboardingTaskEntity, UUID> {
    List<OnboardingTaskEntity> findAllByWorkspaceOrderBySortOrderAscCreatedAtAsc(ClientWorkspaceEntity workspace);
    List<OnboardingTaskEntity> findAllByClientOrderBySortOrderAscCreatedAtAsc(ClientEntity client);
    Optional<OnboardingTaskEntity> findByWorkspaceAndClientServiceAndTaskKey(ClientWorkspaceEntity workspace, ClientServiceEntity clientService, String taskKey);
    Optional<OnboardingTaskEntity> findByWorkspaceAndClientServiceIsNullAndTaskKey(ClientWorkspaceEntity workspace, String taskKey);
}
