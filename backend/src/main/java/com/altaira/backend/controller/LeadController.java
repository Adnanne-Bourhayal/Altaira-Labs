package com.altaira.backend.controller;

import com.altaira.backend.dto.lead.CreateLeadRequest;
import com.altaira.backend.model.Lead;
import com.altaira.backend.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads")
@CrossOrigin(origins = {
        "http://localhost:3000"
})
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @PostMapping
    public Lead createLead(@Valid @RequestBody CreateLeadRequest request) {
        return leadService.createLead(request);
    }

    @GetMapping
    public List<Lead> getAllLeads() {
        return leadService.getAllLeads();
    }
}
