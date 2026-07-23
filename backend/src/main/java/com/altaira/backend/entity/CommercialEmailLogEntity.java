package com.altaira.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_email_logs")
public class CommercialEmailLogEntity {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "flow_id", nullable = false) private CommercialFlowEntity flow;
    @Column(name = "email_type", nullable = false, length = 50) private String emailType;
    @Column(nullable = false, length = 200) private String recipient;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "provider_message_id", length = 240) private String providerMessageId;
    @Column(name = "safe_error", columnDefinition = "TEXT") private String safeError;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "sent_at") private Instant sentAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public CommercialFlowEntity getFlow() { return flow; }
    public void setFlow(CommercialFlowEntity flow) { this.flow = flow; }
    public String getEmailType() { return emailType; }
    public void setEmailType(String emailType) { this.emailType = emailType; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }
    public String getSafeError() { return safeError; }
    public void setSafeError(String safeError) { this.safeError = safeError; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
