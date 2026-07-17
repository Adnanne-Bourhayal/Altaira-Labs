package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientProjectConfigSnapshotEntity;
import com.altaira.backend.entity.ClientProjectEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientProjectConfigSnapshotRepository extends JpaRepository<ClientProjectConfigSnapshotEntity, UUID> {

    @EntityGraph(attributePaths = {"project", "client"})
    List<ClientProjectConfigSnapshotEntity> findAllByProjectOrderByCreatedAtDesc(ClientProjectEntity project);
}
