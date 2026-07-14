package com.altaira.backend.service;

import com.altaira.backend.dto.clientservice.AssignClientServiceRequest;
import com.altaira.backend.dto.clientservice.ClientServiceResponse;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.entity.ServiceEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.ClientServiceStatus;
import com.altaira.backend.repository.ClientServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ClientServiceAssignmentService {

    private final ClientServiceRepository clientServiceRepository;
    private final ClientManagementService clientManagementService;
    private final ServiceCatalogService serviceCatalogService;

    public ClientServiceAssignmentService(
            ClientServiceRepository clientServiceRepository,
            ClientManagementService clientManagementService,
            ServiceCatalogService serviceCatalogService
    ) {
        this.clientServiceRepository = clientServiceRepository;
        this.clientManagementService = clientManagementService;
        this.serviceCatalogService = serviceCatalogService;
    }

    public ClientServiceResponse assignService(UUID clientId, AssignClientServiceRequest request) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        ServiceEntity service = serviceCatalogService.findServiceEntity(request.getServiceId());

        var existingAssignment = clientServiceRepository.findByClientAndService(client, service);
        if (existingAssignment.isPresent()) {
            ClientServiceEntity entity = existingAssignment.get();

            if (request.getStatus() != null && !request.getStatus().isBlank()) {
                entity.setStatus(ClientServiceStatus.parse(request.getStatus()).value());
            }

            if (request.getNotes() != null && !request.getNotes().isBlank()) {
                entity.setNotes(trimOptional(request.getNotes()));
            }

            return map(clientServiceRepository.save(entity));
        }

        ClientServiceEntity entity = new ClientServiceEntity();
        entity.setClient(client);
        entity.setService(service);
        entity.setStatus(normalizeStatusOrDefault(request.getStatus()));
        entity.setNotes(trimOptional(request.getNotes()));

        return map(clientServiceRepository.save(entity));
    }

    public List<ClientServiceResponse> getClientServices(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);

        return clientServiceRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(this::map)
                .toList();
    }

    public ClientServiceResponse updateStatus(UUID id, String status) {
        ClientServiceEntity entity = clientServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client service", id));

        entity.setStatus(ClientServiceStatus.parse(status).value());
        return map(clientServiceRepository.save(entity));
    }

    private String normalizeStatusOrDefault(String status) {
        if (status == null || status.isBlank()) {
            return ClientServiceStatus.PLANNED.value();
        }

        return ClientServiceStatus.parse(status).value();
    }

    private ClientServiceResponse map(ClientServiceEntity entity) {
        return new ClientServiceResponse(
                entity.getId(),
                entity.getClient().getId(),
                serviceCatalogService.map(entity.getService()),
                entity.getStatus(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String trimOptional(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.trim();
    }
}
