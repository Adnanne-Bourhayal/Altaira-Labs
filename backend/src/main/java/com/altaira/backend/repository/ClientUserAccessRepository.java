package com.altaira.backend.repository;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientUserAccessEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientUserAccessRepository extends JpaRepository<ClientUserAccessEntity, UUID> {
    @EntityGraph(attributePaths = "client")
    List<ClientUserAccessEntity> findAllByUserAndActiveTrue(AppUserEntity user);

    @EntityGraph(attributePaths = "client")
    Optional<ClientUserAccessEntity> findByUserAndClientAndActiveTrue(AppUserEntity user, ClientEntity client);

    Optional<ClientUserAccessEntity> findByUserAndClient(AppUserEntity user, ClientEntity client);
}
