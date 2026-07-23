package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
        name = "provisioning_external_resources",
        uniqueConstraints = @UniqueConstraint(
                name = "provisioning_external_resource_idempotency_unique",
                columnNames = {"idempotency_key"}
        )
)
public class ProvisioningExternalResourceEntity {

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

    @Column(name = "external_resource_id", length = 240)
    private String externalResourceId;

    @Column(name = "external_url", length = 1000)
    private String externalUrl;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "idempotency_key", nullable = false, length = 200)
    private String idempotencyKey;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ProvisioningPlanEntity getPlan() { return plan; }
    public void setPlan(ProvisioningPlanEntity plan) { this.plan = plan; }
    public String getProviderKey() { return providerKey; }
    public void setProviderKey(String providerKey) { this.providerKey = providerKey; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getExternalResourceId() { return externalResourceId; }
    public void setExternalResourceId(String externalResourceId) { this.externalResourceId = externalResourceId; }
    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
