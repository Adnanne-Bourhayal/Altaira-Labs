package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientCrmLeadNoteEntity;
import com.altaira.backend.entity.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientCrmLeadNoteRepository extends JpaRepository<ClientCrmLeadNoteEntity, UUID> {
    List<ClientCrmLeadNoteEntity> findAllByLeadOrderByCreatedAtAsc(ClientCrmLeadEntity lead);

    void deleteAllByClient(ClientEntity client);
}
