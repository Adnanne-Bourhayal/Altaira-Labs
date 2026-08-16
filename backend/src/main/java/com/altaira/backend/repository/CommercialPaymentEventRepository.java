package com.altaira.backend.repository;

import com.altaira.backend.entity.CommercialPaymentEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CommercialPaymentEventRepository extends JpaRepository<CommercialPaymentEventEntity, UUID> {
    Optional<CommercialPaymentEventEntity> findByProviderEventId(String providerEventId);
}
