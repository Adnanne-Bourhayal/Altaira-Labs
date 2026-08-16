package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.entity.ProvisioningSelectedToolEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProvisioningSelectedToolRepository extends JpaRepository<ProvisioningSelectedToolEntity, UUID> {
    List<ProvisioningSelectedToolEntity> findAllByPlanOrderBySortOrder(ProvisioningPlanEntity plan);
    void deleteAllByPlan(ProvisioningPlanEntity plan);
}
