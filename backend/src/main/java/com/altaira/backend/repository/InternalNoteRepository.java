package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.InternalNoteEntity;
import com.altaira.backend.entity.LeadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InternalNoteRepository extends JpaRepository<InternalNoteEntity, UUID> {
    List<InternalNoteEntity> findAllByLeadOrderByCreatedAtDesc(LeadEntity lead);
    List<InternalNoteEntity> findAllByClientOrderByCreatedAtDesc(ClientEntity client);
}
