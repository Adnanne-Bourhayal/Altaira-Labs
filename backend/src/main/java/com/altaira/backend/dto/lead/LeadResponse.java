package com.altaira.backend.dto.lead;

import java.time.Instant;
import java.util.UUID;

public class LeadResponse {

    private UUID id;
    private String fullName;
    private String businessName;
    private String email;
    private String phone;
    private String industry;
    private String serviceInterest;
    private String goals;
    private String status;
    private Instant createdAt;
    private Boolean emailNotificationSent;
    private String emailNotificationMessage;

    public LeadResponse() {
    }

    public LeadResponse(UUID id, String fullName, String businessName, String email, String industry, String goals, String status, Instant createdAt) {
        this(id, fullName, businessName, email, null, industry, null, goals, status, createdAt, null, null);
    }

    public LeadResponse(UUID id, String fullName, String businessName, String email, String phone, String industry, String serviceInterest, String goals, String status, Instant createdAt) {
        this(id, fullName, businessName, email, phone, industry, serviceInterest, goals, status, createdAt, null, null);
    }

    public LeadResponse(UUID id, String fullName, String businessName, String email, String industry, String goals, String status, Instant createdAt, Boolean emailNotificationSent, String emailNotificationMessage) {
        this(id, fullName, businessName, email, null, industry, null, goals, status, createdAt, emailNotificationSent, emailNotificationMessage);
    }

    public LeadResponse(UUID id, String fullName, String businessName, String email, String phone, String industry, String serviceInterest, String goals, String status, Instant createdAt, Boolean emailNotificationSent, String emailNotificationMessage) {
        this.id = id;
        this.fullName = fullName;
        this.businessName = businessName;
        this.email = email;
        this.phone = phone;
        this.industry = industry;
        this.serviceInterest = serviceInterest;
        this.goals = goals;
        this.status = status;
        this.createdAt = createdAt;
        this.emailNotificationSent = emailNotificationSent;
        this.emailNotificationMessage = emailNotificationMessage;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getServiceInterest() {
        return serviceInterest;
    }

    public void setServiceInterest(String serviceInterest) {
        this.serviceInterest = serviceInterest;
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

    public Boolean getEmailNotificationSent() {
        return emailNotificationSent;
    }

    public void setEmailNotificationSent(Boolean emailNotificationSent) {
        this.emailNotificationSent = emailNotificationSent;
    }

    public String getEmailNotificationMessage() {
        return emailNotificationMessage;
    }

    public void setEmailNotificationMessage(String emailNotificationMessage) {
        this.emailNotificationMessage = emailNotificationMessage;
    }
}
