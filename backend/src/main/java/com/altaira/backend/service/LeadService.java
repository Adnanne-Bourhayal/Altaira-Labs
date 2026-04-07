package com.altaira.backend.service;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.model.Lead;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LeadService {

    private final List<Lead> leads = new ArrayList<>();

    public Lead createLead(CreateLeadRequest request) {
        Lead lead = new Lead(
                UUID.randomUUID(),
                request.getFullName(),
                request.getBusinessName(),
                request.getEmail(),
                request.getIndustry(),
                request.getGoals(),
                "new",
                Instant.now()
        );

        leads.add(lead);
        return lead;
    }

    public List<Lead> getAllLeads() {
        return leads;
    }
}
