package com.altaira.backend.service;

import com.altaira.backend.dto.lead.CreateLeadRequest;
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

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    public LeadResponse createLead(CreateLeadRequest request) {
        LeadEntity entity = new LeadEntity();
        entity.setFullName(trimRequired(request.getFullName()));
        entity.setBusinessName(trimRequired(request.getBusinessName()));
        entity.setEmail(trimRequired(request.getEmail()).toLowerCase(Locale.ROOT));
        entity.setIndustry(trimOptional(request.getIndustry()));
        entity.setGoals(trimOptional(request.getGoals()));
        entity.setStatus(LeadStatus.NEW.value());
        entity.setCreatedAt(Instant.now());

        LeadEntity saved = leadRepository.save(entity);
        return map(saved);
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
                entity.getIndustry(),
                entity.getGoals(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
