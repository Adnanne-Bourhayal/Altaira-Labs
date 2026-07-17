package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientInvitationEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientInvitationRepository extends JpaRepository<ClientInvitationEntity, UUID> {
    List<ClientInvitationEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);
    List<ClientInvitationEntity> findAllByClientAndEmailIgnoreCaseAndAcceptedAtIsNullAndRevokedAtIsNull(ClientEntity client, String email);

    @EntityGraph(attributePaths = "client")
    Optional<ClientInvitationEntity> findByTokenHash(String tokenHash);
}
