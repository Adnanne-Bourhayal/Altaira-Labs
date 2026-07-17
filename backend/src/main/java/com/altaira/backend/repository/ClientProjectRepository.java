package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientProjectEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientProjectRepository extends JpaRepository<ClientProjectEntity, UUID> {
    @Override
    @EntityGraph(attributePaths = {"client", "clientService", "clientService.service"})
    Optional<ClientProjectEntity> findById(UUID id);

    @EntityGraph(attributePaths = {"clientService", "clientService.service"})
    List<ClientProjectEntity> findAllByClientOrderByCreatedAtAsc(ClientEntity client);

    Optional<ClientProjectEntity> findByClientAndClientServiceAndProjectKey(ClientEntity client, ClientServiceEntity clientService, String projectKey);
}
