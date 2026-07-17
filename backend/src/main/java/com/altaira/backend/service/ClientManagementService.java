package com.altaira.backend.service;

import com.altaira.backend.dto.client.ClientResponse;
import com.altaira.backend.dto.client.CreateClientRequest;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.exception.LeadNotFoundException;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.ClientStatus;
import com.altaira.backend.model.SectorType;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ClientManagementService {

    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;

    public ClientManagementService(ClientRepository clientRepository, LeadRepository leadRepository) {
        this.clientRepository = clientRepository;
        this.leadRepository = leadRepository;
    }

    public ClientResponse createClient(CreateClientRequest request) {
        LeadEntity sourceLead = null;

        if (request.getSourceLeadId() != null) {
            sourceLead = leadRepository.findById(request.getSourceLeadId())
                    .orElseThrow(() -> new LeadNotFoundException(request.getSourceLeadId()));

            var existingClient = clientRepository.findBySourceLead(sourceLead);
            if (existingClient.isPresent()) {
                return map(existingClient.get());
            }
        }

        ClientEntity entity = new ClientEntity();
        entity.setName(trimRequired(request.getName()));
        entity.setCompany(trimRequired(request.getCompany()));
        entity.setEmail(trimRequired(request.getEmail()).toLowerCase(Locale.ROOT));
        entity.setPhone(trimOptional(request.getPhone()));
        entity.setSourceLead(sourceLead);
        entity.setStatus(ClientStatus.parse(request.getStatus()).value());
        entity.setSectorType(SectorType.parse(request.getSectorType()).value());

        return map(clientRepository.save(entity));
    }

    public ClientResponse createClientFromLead(UUID leadId) {
        LeadEntity lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new LeadNotFoundException(leadId));

        var existingClient = clientRepository.findBySourceLead(lead);
        if (existingClient.isPresent()) {
            return map(existingClient.get());
        }

        ClientEntity entity = new ClientEntity();
        entity.setName(lead.getFullName());
        entity.setCompany(lead.getBusinessName());
        entity.setEmail(lead.getEmail());
        entity.setPhone(trimOptional(lead.getPhone()));
        entity.setSourceLead(lead);
        entity.setStatus(ClientStatus.ACTIVE.value());
        entity.setSectorType(inferSectorFromLead(lead));

        return map(clientRepository.save(entity));
    }

    public List<ClientResponse> getAllClients() {
        return clientRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();
    }

    public ClientResponse getClientById(UUID id) {
        return map(findClientEntity(id));
    }

    ClientEntity findClientEntity(UUID id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
    }

    ClientResponse map(ClientEntity entity) {
        UUID sourceLeadId = entity.getSourceLead() == null ? null : entity.getSourceLead().getId();

        return new ClientResponse(
                entity.getId(),
                entity.getName(),
                entity.getCompany(),
                entity.getEmail(),
                entity.getPhone(),
                sourceLeadId,
                entity.getStatus(),
                entity.getSectorType(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String inferSectorFromLead(LeadEntity lead) {
        String combined = ((lead.getIndustry() == null ? "" : lead.getIndustry()) + " " +
                (lead.getServiceInterest() == null ? "" : lead.getServiceInterest()) + " " +
                (lead.getGoals() == null ? "" : lead.getGoals())).toLowerCase(Locale.ROOT);

        if (combined.contains("clinic") || combined.contains("dental") || combined.contains("patient") || combined.contains("clinica")) {
            return SectorType.CLINICS.value();
        }

        if (combined.contains("restaurant") || combined.contains("reservation") || combined.contains("restaurante") || combined.contains("menu")) {
            return SectorType.RESTAURANTS.value();
        }

        if (combined.contains("car") || combined.contains("dealer") || combined.contains("vehicle") || combined.contains("concesionario")) {
            return SectorType.CAR_DEALERS.value();
        }

        return SectorType.CUSTOM.value();
    }

    private String trimRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimOptional(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.trim();
    }
}
