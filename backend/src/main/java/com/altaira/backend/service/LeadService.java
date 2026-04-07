package com.altaira.backend.service;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.model.Lead;
import com.altaira.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class LeadService {

    private final LeadRepository leadRepository;

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    public Lead createLead(CreateLeadRequest request) {
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

    public List<Lead> getAllLeads() {
        return leadRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    private Lead map(LeadEntity e) {
        return new Lead(
                e.getId(),
                e.getFullName(),
                e.getBusinessName(),
                e.getEmail(),
                e.getIndustry(),
                e.getGoals(),
                e.getStatus(),
                e.getCreatedAt()
        );
    }
}
