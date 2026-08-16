package com.altaira.backend.service;

import com.altaira.backend.dto.client.ClientResponse;
import com.altaira.backend.dto.clientportal.ClientPortalResponse;
import com.altaira.backend.dto.clientservice.AssignClientServiceRequest;
import com.altaira.backend.dto.clientservice.ClientServiceResponse;
import com.altaira.backend.dto.lead.LeadConversionRequest;
import com.altaira.backend.dto.lead.LeadConversionResponse;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.exception.LeadNotFoundException;
import com.altaira.backend.model.LeadIntakeFormKey;
import com.altaira.backend.model.LeadStatus;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LeadConversionService {

    private final LeadRepository leadRepository;
    private final ClientRepository clientRepository;
    private final ClientManagementService clientManagementService;
    private final ClientServiceAssignmentService clientServiceAssignmentService;
    private final ServiceCatalogService serviceCatalogService;
    private final ClientPortalService clientPortalService;
    private final LeadService leadService;
    private final boolean legacyDirectConversionEnabled;

    public LeadConversionService(
            LeadRepository leadRepository,
            ClientRepository clientRepository,
            ClientManagementService clientManagementService,
            ClientServiceAssignmentService clientServiceAssignmentService,
            ServiceCatalogService serviceCatalogService,
            ClientPortalService clientPortalService,
            LeadService leadService,
            @Value("${altaira.commercial.legacy-direct-conversion-enabled:false}") boolean legacyDirectConversionEnabled
    ) {
        this.leadRepository = leadRepository;
        this.clientRepository = clientRepository;
        this.clientManagementService = clientManagementService;
        this.clientServiceAssignmentService = clientServiceAssignmentService;
        this.serviceCatalogService = serviceCatalogService;
        this.clientPortalService = clientPortalService;
        this.leadService = leadService;
        this.legacyDirectConversionEnabled = legacyDirectConversionEnabled;
    }

    public LeadConversionResponse convert(UUID leadId, LeadConversionRequest request) {
        if (!legacyDirectConversionEnabled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Direct lead conversion is disabled. Confirm payment through the approved provisioning plan."
            );
        }
        return convertInternal(leadId, request);
    }

    public LeadConversionResponse convertAfterConfirmedPayment(
            UUID leadId,
            List<String> serviceKeys,
            String notes
    ) {
        LeadConversionRequest request = new LeadConversionRequest();
        request.setServiceKeys(serviceKeys);
        request.setConfirmed(true);
        request.setNotes(notes);
        return convertInternal(leadId, request);
    }

    private LeadConversionResponse convertInternal(UUID leadId, LeadConversionRequest request) {
        LeadEntity lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new LeadNotFoundException(leadId));

        List<String> serviceKeys = new LinkedHashSet<>(request.getServiceKeys())
                .stream()
                .map(LeadIntakeFormKey::parse)
                .filter(formKey -> formKey != LeadIntakeFormKey.GENERAL)
                .map(LeadIntakeFormKey::value)
                .toList();

        if (serviceKeys.isEmpty()) {
            throw new IllegalArgumentException("At least one launch service is required");
        }

        boolean clientCreated = clientRepository.findBySourceLead(lead).isEmpty();
        ClientResponse client = clientManagementService.createClientFromLead(leadId);

        List<ClientServiceResponse> assignments = serviceKeys.stream()
                .map(serviceKey -> {
                    AssignClientServiceRequest assignment = new AssignClientServiceRequest();
                    assignment.setServiceId(serviceCatalogService.findServiceForModuleKey(serviceKey).getId());
                    assignment.setNotes(trimOptional(request.getNotes()));
                    return clientServiceAssignmentService.assignService(client.getId(), assignment);
                })
                .toList();

        ClientPortalResponse portal = clientPortalService.getPortalForAdmin(client.getId());
        LeadResponse convertedLead = leadService.updateStatus(leadId, LeadStatus.CONVERTED.value());

        return new LeadConversionResponse(
                convertedLead,
                client,
                clientCreated,
                assignments,
                true,
                portal.getProjects()
        );
    }

    private String trimOptional(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
