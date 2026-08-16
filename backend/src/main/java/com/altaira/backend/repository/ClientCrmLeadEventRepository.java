package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientCrmLeadEventEntity;
import com.altaira.backend.entity.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientCrmLeadEventRepository extends JpaRepository<ClientCrmLeadEventEntity, UUID> {
    List<ClientCrmLeadEventEntity> findAllByLeadOrderByCreatedAtAscIdAsc(ClientCrmLeadEntity lead);

    void deleteAllByClient(ClientEntity client);
}
