package com.altaira.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_payment_sessions")
public class CommercialPaymentSessionEntity {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "flow_id", nullable = false) private CommercialFlowEntity flow;
    @Column(nullable = false, length = 30) private String provider = "STRIPE";
    @Column(name = "provider_mode", nullable = false, length = 20) private String providerMode;
    @Column(nullable = false, length = 40) private String status;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false, length = 3) private String currency;
    @Column(name = "customer_email", nullable = false, length = 200) private String customerEmail;
    @Column(nullable = false, length = 500) private String description;
    @Column(name = "provider_session_id", unique = true, length = 240) private String providerSessionId;
    @Column(name = "checkout_url", columnDefinition = "TEXT") private String checkoutUrl;
    @Column(name = "payment_intent_id", length = 240) private String paymentIntentId;
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 200) private String idempotencyKey;
    @Column(name = "safe_error", columnDefinition = "TEXT") private String safeError;
    @Column(name = "expires_at") private Instant expiresAt;
    @Column(name = "confirmed_at") private Instant confirmedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public CommercialFlowEntity getFlow() { return flow; }
    public void setFlow(CommercialFlowEntity flow) { this.flow = flow; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderMode() { return providerMode; }
    public void setProviderMode(String providerMode) { this.providerMode = providerMode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(long amountMinor) { this.amountMinor = amountMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getProviderSessionId() { return providerSessionId; }
    public void setProviderSessionId(String providerSessionId) { this.providerSessionId = providerSessionId; }
    public String getCheckoutUrl() { return checkoutUrl; }
    public void setCheckoutUrl(String checkoutUrl) { this.checkoutUrl = checkoutUrl; }
    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getSafeError() { return safeError; }
    public void setSafeError(String safeError) { this.safeError = safeError; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
