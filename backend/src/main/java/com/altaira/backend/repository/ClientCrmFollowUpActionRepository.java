package com.altaira.backend.repository;

import com.altaira.backend.entity.ClientCrmFollowUpActionEntity;
import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientCrmFollowUpActionRepository extends JpaRepository<ClientCrmFollowUpActionEntity, UUID> {
    List<ClientCrmFollowUpActionEntity> findAllByLeadOrderByCreatedAtAscIdAsc(ClientCrmLeadEntity lead);

    Optional<ClientCrmFollowUpActionEntity> findByIdAndLead(UUID id, ClientCrmLeadEntity lead);

    void deleteAllByClient(ClientEntity client);
}
