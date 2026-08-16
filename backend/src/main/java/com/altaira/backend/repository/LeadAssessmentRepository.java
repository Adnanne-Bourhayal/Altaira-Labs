package com.altaira.backend.repository;

import com.altaira.backend.entity.LeadAssessmentEntity;
import com.altaira.backend.entity.LeadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadAssessmentRepository extends JpaRepository<LeadAssessmentEntity, UUID> {
    List<LeadAssessmentEntity> findAllByLeadOrderByUpdatedAtDesc(LeadEntity lead);
    Optional<LeadAssessmentEntity> findByLeadAndFormKey(LeadEntity lead, String formKey);
}
