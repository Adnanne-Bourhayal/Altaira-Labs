package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningManualStepEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProvisioningManualStepRepository extends JpaRepository<ProvisioningManualStepEntity, UUID> {
    List<ProvisioningManualStepEntity> findAllByPlanOrderBySortOrder(ProvisioningPlanEntity plan);
    void deleteAllByPlan(ProvisioningPlanEntity plan);
}
