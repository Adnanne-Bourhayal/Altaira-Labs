package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientCrmWebhookTokenEntity;
import com.altaira.backend.entity.ClientEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientCrmWebhookTokenRepository extends JpaRepository<ClientCrmWebhookTokenEntity, UUID> {
    @EntityGraph(attributePaths = "client")
    Optional<ClientCrmWebhookTokenEntity> findByTokenHashAndActiveTrue(String tokenHash);

    List<ClientCrmWebhookTokenEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);

    Optional<ClientCrmWebhookTokenEntity> findByIdAndClient(UUID id, ClientEntity client);

    boolean existsByTokenHash(String tokenHash);
}
