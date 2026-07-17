package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientProjectAssetEntity;
import com.altaira.backend.entity.ClientProjectEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientProjectAssetRepository extends JpaRepository<ClientProjectAssetEntity, UUID> {
    @EntityGraph(attributePaths = {"project", "client", "uploadedByUser"})
    List<ClientProjectAssetEntity> findAllByProjectOrderByUploadedAtAsc(ClientProjectEntity project);

    List<ClientProjectAssetEntity> findAllByClientOrderByUploadedAtDesc(ClientEntity client);

    @Override
    @EntityGraph(attributePaths = {"project", "client", "uploadedByUser"})
    Optional<ClientProjectAssetEntity> findById(UUID id);
}
