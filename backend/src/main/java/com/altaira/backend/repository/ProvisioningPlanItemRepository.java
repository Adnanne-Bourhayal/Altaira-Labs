package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.entity.ProvisioningPlanItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProvisioningPlanItemRepository extends JpaRepository<ProvisioningPlanItemEntity, UUID> {
    List<ProvisioningPlanItemEntity> findAllByPlanOrderBySortOrder(ProvisioningPlanEntity plan);
    void deleteAllByPlan(ProvisioningPlanEntity plan);
}
