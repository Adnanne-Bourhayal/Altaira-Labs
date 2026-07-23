package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.WorkspaceTaskEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceTaskRepository extends JpaRepository<WorkspaceTaskEntity, UUID> {

    @Override
    @EntityGraph(attributePaths = {
            "workspace",
            "client",
            "clientService",
            "clientService.service",
            "project",
            "createdByUser"
    })
    Optional<WorkspaceTaskEntity> findById(UUID id);

    @EntityGraph(attributePaths = {
            "workspace",
            "client",
            "clientService",
            "clientService.service",
            "project",
            "createdByUser"
    })
    List<WorkspaceTaskEntity> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
            "workspace",
            "client",
            "clientService",
            "clientService.service",
            "project",
            "createdByUser"
    })
    List<WorkspaceTaskEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);

    @EntityGraph(attributePaths = {
            "workspace",
            "client",
            "clientService",
            "clientService.service",
            "project",
            "createdByUser"
    })
    List<WorkspaceTaskEntity> findAllByClientAndVisibilityOrderByCreatedAtDesc(
            ClientEntity client,
            String visibility
    );
}
