package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "provisioning_plan_items")
public class ProvisioningPlanItemEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private ProvisioningPlanEntity plan;

    @Column(name = "provider_key", nullable = false, length = 40)
    private String providerKey;

    @Column(name = "resource_type", nullable = false, length = 60)
    private String resourceType;

    @Column(name = "resource_name", nullable = false, length = 240)
    private String resourceName;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private boolean required;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ProvisioningPlanEntity getPlan() { return plan; }
    public void setPlan(ProvisioningPlanEntity plan) { this.plan = plan; }
    public String getProviderKey() { return providerKey; }
    public void setProviderKey(String providerKey) { this.providerKey = providerKey; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
