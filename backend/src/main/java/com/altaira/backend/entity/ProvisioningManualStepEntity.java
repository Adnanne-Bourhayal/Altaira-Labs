package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "provisioning_manual_steps")
public class ProvisioningManualStepEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private ProvisioningPlanEntity plan;

    @Column(name = "provider_key", nullable = false, length = 40)
    private String providerKey;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private boolean required;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ProvisioningPlanEntity getPlan() { return plan; }
    public void setPlan(ProvisioningPlanEntity plan) { this.plan = plan; }
    public String getProviderKey() { return providerKey; }
    public void setProviderKey(String providerKey) { this.providerKey = providerKey; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
