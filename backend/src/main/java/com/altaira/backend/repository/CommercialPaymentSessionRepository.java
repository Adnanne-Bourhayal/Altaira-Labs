package com.altaira.backend.repository;

import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.CommercialPaymentSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommercialPaymentSessionRepository extends JpaRepository<CommercialPaymentSessionEntity, UUID> {
    Optional<CommercialPaymentSessionEntity> findByIdempotencyKey(String idempotencyKey);
    Optional<CommercialPaymentSessionEntity> findByProviderSessionId(String providerSessionId);
    List<CommercialPaymentSessionEntity> findAllByFlowOrderByCreatedAtDesc(CommercialFlowEntity flow);
}
