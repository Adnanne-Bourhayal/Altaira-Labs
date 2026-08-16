package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientWorkspaceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientWorkspaceRepository extends JpaRepository<ClientWorkspaceEntity, UUID> {
    Optional<ClientWorkspaceEntity> findByClient(ClientEntity client);
}
