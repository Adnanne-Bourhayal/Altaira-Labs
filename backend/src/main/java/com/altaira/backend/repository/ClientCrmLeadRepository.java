package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientCrmLeadRepository extends JpaRepository<ClientCrmLeadEntity, UUID> {
    @EntityGraph(attributePaths = {"client", "createdByUser"})
    List<ClientCrmLeadEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);

    @EntityGraph(attributePaths = {"client", "createdByUser"})
    Optional<ClientCrmLeadEntity> findByIdAndClient(UUID id, ClientEntity client);
}
