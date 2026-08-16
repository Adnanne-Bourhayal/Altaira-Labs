package com.altaira.backend.repository;

import com.altaira.backend.entity.CommercialEmailLogEntity;
import com.altaira.backend.entity.CommercialFlowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CommercialEmailLogRepository extends JpaRepository<CommercialEmailLogEntity, UUID> {
    List<CommercialEmailLogEntity> findAllByFlowOrderByCreatedAtDesc(CommercialFlowEntity flow);
    boolean existsByFlowAndEmailTypeAndStatus(CommercialFlowEntity flow, String emailType, String status);
}
