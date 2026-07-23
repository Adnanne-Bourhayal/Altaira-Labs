package com.altaira.backend.service;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.dto.lead.CreateAdminLeadIntakeRequest;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.exception.LeadNotFoundException;
import com.altaira.backend.model.LeadStatus;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadNotificationService leadNotificationService;

    public LeadService(LeadRepository leadRepository, LeadNotificationService leadNotificationService) {
        this.leadRepository = leadRepository;
        this.leadNotificationService = leadNotificationService;
    }

    public LeadResponse createLead(CreateLeadRequest request) {
        LeadEntity saved = saveLead(
                request.getFullName(),
                request.getBusinessName(),
                request.getEmail(),
                request.getPhone(),
                request.getIndustry(),
                request.getServiceInterest(),
                request.getGoals()
        );
        EmailNotificationResult notificationResult = leadNotificationService.sendLeadCreatedNotification(saved);

        LeadResponse response = map(saved);
        response.setEmailNotificationSent(notificationResult.sent());
        response.setEmailNotificationMessage(notificationResult.message());
        return response;
    }

    public LeadResponse createAdminLead(CreateAdminLeadIntakeRequest request, String formKey) {
        return map(saveLead(
                request.getFullName(),
                request.getBusinessName(),
                request.getEmail(),
                request.getPhone(),
                request.getIndustry(),
                formKey,
                request.getGoals()
        ));
    }

    public List<LeadResponse> getAllLeads() {
        return leadRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();
    }

    public LeadResponse getLeadById(UUID id) {
        LeadEntity entity = leadRepository.findById(id)
                .orElseThrow(() -> new LeadNotFoundException(id));

        return map(entity);
    }

    public LeadResponse updateStatus(UUID id, String status) {
        String normalizedStatus = LeadStatus.parse(status).value();

        LeadEntity entity = leadRepository.findById(id)
                .orElseThrow(() -> new LeadNotFoundException(id));

        entity.setStatus(normalizedStatus);

        LeadEntity updated = leadRepository.save(entity);

        return map(updated);
    }

    private LeadEntity saveLead(
            String fullName,
            String businessName,
            String email,
            String phone,
            String industry,
            String serviceInterest,
            String goals
    ) {
        LeadEntity entity = new LeadEntity();
        entity.setFullName(trimRequired(fullName));
        entity.setBusinessName(trimRequired(businessName));
        entity.setEmail(trimRequired(email).toLowerCase(Locale.ROOT));
        entity.setPhone(trimOptional(phone));
        entity.setIndustry(trimOptional(industry));
        entity.setServiceInterest(trimOptional(serviceInterest));
        entity.setGoals(trimOptional(goals));
        entity.setStatus(LeadStatus.NEW.value());
        entity.setCreatedAt(Instant.now());
        return leadRepository.save(entity);
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

    private LeadResponse map(LeadEntity entity) {
        return new LeadResponse(
                entity.getId(),
                entity.getFullName(),
                entity.getBusinessName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getIndustry(),
                entity.getServiceInterest(),
                entity.getGoals(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
