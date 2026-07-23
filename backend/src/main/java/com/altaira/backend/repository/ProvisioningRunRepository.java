package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.entity.ProvisioningRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProvisioningRunRepository extends JpaRepository<ProvisioningRunEntity, UUID> {
    Optional<ProvisioningRunEntity> findByIdempotencyKey(String idempotencyKey);
    List<ProvisioningRunEntity> findAllByPlanOrderByCreatedAtDesc(ProvisioningPlanEntity plan);
}
