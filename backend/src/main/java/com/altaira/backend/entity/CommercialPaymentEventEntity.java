package com.altaira.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_payment_events")
public class CommercialPaymentEventEntity {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "payment_session_id") private CommercialPaymentSessionEntity paymentSession;
    @Column(name = "provider_event_id", nullable = false, unique = true, length = 240) private String providerEventId;
    @Column(name = "event_type", nullable = false, length = 100) private String eventType;
    @Column(nullable = false, length = 30) private String status = "RECEIVED";
    @Column(name = "safe_error", columnDefinition = "TEXT") private String safeError;
    @Column(name = "received_at", nullable = false, updatable = false) private Instant receivedAt;
    @Column(name = "processed_at") private Instant processedAt;
    @PrePersist void onCreate() { receivedAt = Instant.now(); }
    public UUID getId() { return id; }
    public CommercialPaymentSessionEntity getPaymentSession() { return paymentSession; }
    public void setPaymentSession(CommercialPaymentSessionEntity paymentSession) { this.paymentSession = paymentSession; }
    public String getProviderEventId() { return providerEventId; }
    public void setProviderEventId(String providerEventId) { this.providerEventId = providerEventId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSafeError() { return safeError; }
    public void setSafeError(String safeError) { this.safeError = safeError; }
    public Instant getReceivedAt() { return receivedAt; }
    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
}
