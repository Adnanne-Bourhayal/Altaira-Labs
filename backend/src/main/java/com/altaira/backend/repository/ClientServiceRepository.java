package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientServiceRepository extends JpaRepository<ClientServiceEntity, UUID> {
    List<ClientServiceEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);
}
