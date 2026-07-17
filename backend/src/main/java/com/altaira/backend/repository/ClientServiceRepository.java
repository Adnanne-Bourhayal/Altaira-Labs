package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.entity.ServiceEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientServiceRepository extends JpaRepository<ClientServiceEntity, UUID> {
    @EntityGraph(attributePaths = "service")
    List<ClientServiceEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);

    @EntityGraph(attributePaths = "service")
    Optional<ClientServiceEntity> findByClientAndService(ClientEntity client, ServiceEntity service);
}
