package com.altaira.backend.repository;

import com.altaira.backend.entity.LeadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<LeadEntity, UUID> {
    List<LeadEntity> findAllByOrderByCreatedAtDesc();
}
