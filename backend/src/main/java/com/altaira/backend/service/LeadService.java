package com.altaira.backend.service;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.dto.lead.LeadResponse;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class LeadService {

    private final LeadRepository leadRepository;

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    public LeadResponse createLead(CreateLeadRequest request) {
        LeadEntity entity = new LeadEntity();
        entity.setFullName(request.getFullName());
        entity.setBusinessName(request.getBusinessName());
        entity.setEmail(request.getEmail());
        entity.setIndustry(request.getIndustry());
        entity.setGoals(request.getGoals());
        entity.setStatus("new");
        entity.setCreatedAt(Instant.now());

        LeadEntity saved = leadRepository.save(entity);
        return map(saved);
    }

    public List<LeadResponse> getAllLeads() {
        return leadRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    public LeadResponse getLeadById(UUID id) {
        LeadEntity entity = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        return map(entity);
    }
    public LeadResponse updateStatus(UUID id, String status) {
    LeadEntity entity = leadRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lead not found"));

    entity.setStatus(status);

    LeadEntity updated = leadRepository.save(entity);

    return map(updated);
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
