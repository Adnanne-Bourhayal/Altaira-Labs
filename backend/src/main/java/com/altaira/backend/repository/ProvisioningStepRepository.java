package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningRunEntity;
import com.altaira.backend.entity.ProvisioningStepEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProvisioningStepRepository extends JpaRepository<ProvisioningStepEntity, UUID> {
    List<ProvisioningStepEntity> findAllByRunOrderByCreatedAt(ProvisioningRunEntity run);
    Optional<ProvisioningStepEntity> findByIdempotencyKey(String idempotencyKey);
}
