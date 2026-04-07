package com.altaira.backend.model;

import java.time.Instant;
import java.util.UUID;

public class Lead {

    private UUID id;
    private String fullName;
    private String businessName;
    private String email;
    private String industry;
    private String goals;
    private String status;
    private Instant createdAt;

    public Lead() {
    }

    public Lead(UUID id, String fullName, String businessName, String email, String industry, String goals, String status, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.businessName = businessName;
        this.email = email;
        this.industry = industry;
        this.goals = goals;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getGoals() {
        return goals;
    }

    public void setGoals(String goals) {
        this.goals = goals;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
