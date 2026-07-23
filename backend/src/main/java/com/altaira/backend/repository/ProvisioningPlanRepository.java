package com.altaira.backend.repository;

import com.altaira.backend.entity.LeadAssessmentEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProvisioningPlanRepository extends JpaRepository<ProvisioningPlanEntity, UUID> {
    Optional<ProvisioningPlanEntity> findByAssessment(LeadAssessmentEntity assessment);
    List<ProvisioningPlanEntity> findAllByLeadOrderByUpdatedAtDesc(LeadEntity lead);
}
