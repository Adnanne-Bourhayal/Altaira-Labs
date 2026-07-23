package com.altaira.backend.repository;

import com.altaira.backend.entity.ProvisioningExternalResourceEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProvisioningExternalResourceRepository extends JpaRepository<ProvisioningExternalResourceEntity, UUID> {
    List<ProvisioningExternalResourceEntity> findAllByPlanOrderByProviderKey(ProvisioningPlanEntity plan);
    void deleteAllByPlan(ProvisioningPlanEntity plan);
}
