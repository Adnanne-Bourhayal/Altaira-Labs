package com.altaira.backend.repository;

import com.altaira.backend.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<ServiceEntity, UUID> {
    List<ServiceEntity> findAllByOrderByNameAsc();
    Optional<ServiceEntity> findByNameIgnoreCase(String name);
}
