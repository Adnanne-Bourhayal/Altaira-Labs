package com.altaira.backend.repository;

import com.altaira.backend.entity.LeadAssessmentEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProvisioningPlanRepository extends JpaRepository<ProvisioningPlanEntity, UUID> {
    Optional<ProvisioningPlanEntity> findByAssessment(LeadAssessmentEntity assessment);
    List<ProvisioningPlanEntity> findAllByLeadOrderByUpdatedAtDesc(LeadEntity lead);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select plan from ProvisioningPlanEntity plan where plan.id = :id")
    Optional<ProvisioningPlanEntity> findByIdForUpdate(@Param("id") UUID id);
}
