package com.altaira.backend.repository;

import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CommercialFlowRepository extends JpaRepository<CommercialFlowEntity, UUID> {
    Optional<CommercialFlowEntity> findByPlan(ProvisioningPlanEntity plan);
}
