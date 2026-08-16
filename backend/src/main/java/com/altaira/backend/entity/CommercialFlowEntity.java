package com.altaira.backend.entity;

import com.altaira.backend.model.*;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_flows")
public class CommercialFlowEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false, unique = true)
    private ProvisioningPlanEntity plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private LeadEntity lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private ClientWorkspaceEntity workspace;

    @Column(name = "payment_status", nullable = false, length = 40)
    private String paymentStatus = CommercialPaymentStatus.PAYMENT_NOT_STARTED.name();

    @Column(name = "client_status", nullable = false, length = 40)
    private String clientStatus = CommercialClientStatus.CLIENT_DRAFT.name();

    @Column(name = "workspace_status", nullable = false, length = 40)
    private String workspaceStatus = CommercialWorkspaceStatus.WORKSPACE_PENDING.name();

    @Column(name = "invitation_status", nullable = false, length = 40)
    private String invitationStatus = CommercialInvitationStatus.INVITATION_PENDING.name();

    @Column(name = "provisioning_status", nullable = false, length = 40)
    private String provisioningStatus = CommercialProvisioningStatus.PROVISIONING_PENDING.name();

    @Column(name = "activation_error", columnDefinition = "TEXT")
    private String activationError;

    @Column(name = "payment_confirmed_at")
    private Instant paymentConfirmedAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "invitation_sent_at")
    private Instant invitationSentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public ProvisioningPlanEntity getPlan() { return plan; }
    public void setPlan(ProvisioningPlanEntity plan) { this.plan = plan; }
    public LeadEntity getLead() { return lead; }
    public void setLead(LeadEntity lead) { this.lead = lead; }
    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }
    public ClientWorkspaceEntity getWorkspace() { return workspace; }
    public void setWorkspace(ClientWorkspaceEntity workspace) { this.workspace = workspace; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getClientStatus() { return clientStatus; }
    public void setClientStatus(String clientStatus) { this.clientStatus = clientStatus; }
    public String getWorkspaceStatus() { return workspaceStatus; }
    public void setWorkspaceStatus(String workspaceStatus) { this.workspaceStatus = workspaceStatus; }
    public String getInvitationStatus() { return invitationStatus; }
    public void setInvitationStatus(String invitationStatus) { this.invitationStatus = invitationStatus; }
    public String getProvisioningStatus() { return provisioningStatus; }
    public void setProvisioningStatus(String provisioningStatus) { this.provisioningStatus = provisioningStatus; }
    public String getActivationError() { return activationError; }
    public void setActivationError(String activationError) { this.activationError = activationError; }
    public Instant getPaymentConfirmedAt() { return paymentConfirmedAt; }
    public void setPaymentConfirmedAt(Instant paymentConfirmedAt) { this.paymentConfirmedAt = paymentConfirmedAt; }
    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }
    public Instant getInvitationSentAt() { return invitationSentAt; }
    public void setInvitationSentAt(Instant invitationSentAt) { this.invitationSentAt = invitationSentAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
