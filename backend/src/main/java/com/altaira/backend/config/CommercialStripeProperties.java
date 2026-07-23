package com.altaira.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CommercialStripeProperties {
    private final boolean enabled;
    private final String mode;
    private final String secretKey;
    private final String webhookSecret;
    private final String successUrl;
    private final String cancelUrl;
    private final boolean mockConfirmationEnabled;

    public CommercialStripeProperties(
            @Value("${altaira.commercial.stripe.enabled:false}") boolean enabled,
            @Value("${altaira.commercial.stripe.mode:mock}") String mode,
            @Value("${altaira.commercial.stripe.secret-key:}") String secretKey,
            @Value("${altaira.commercial.stripe.webhook-secret:}") String webhookSecret,
            @Value("${altaira.commercial.stripe.success-url:http://localhost:3000/payment/success}") String successUrl,
            @Value("${altaira.commercial.stripe.cancel-url:http://localhost:3000/payment/cancel}") String cancelUrl,
            @Value("${altaira.commercial.stripe.mock-confirmation-enabled:false}") boolean mockConfirmationEnabled
    ) {
        this.enabled = enabled;
        this.mode = clean(mode).isBlank() ? "mock" : clean(mode).toLowerCase();
        this.secretKey = clean(secretKey);
        this.webhookSecret = clean(webhookSecret);
        this.successUrl = clean(successUrl);
        this.cancelUrl = clean(cancelUrl);
        this.mockConfirmationEnabled = mockConfirmationEnabled;
        validateSafety();
    }

    private void validateSafety() {
        if (secretKey.startsWith("sk_live_")) {
            throw new IllegalStateException("Live Stripe keys are not allowed in this controlled commercial flow");
        }
        if (!("mock".equals(mode) || "test".equals(mode))) {
            throw new IllegalStateException("STRIPE_CHECKOUT_MODE must be mock or test");
        }
        if (enabled && "test".equals(mode) && !secretKey.startsWith("sk_test_")) {
            throw new IllegalStateException("Stripe test mode requires an sk_test_ key");
        }
    }

    public boolean useRealTestApi() { return enabled && "test".equals(mode); }
    public boolean isMock() { return !useRealTestApi(); }
    public String mode() { return mode; }
    public String secretKey() { return secretKey; }
    public String webhookSecret() { return webhookSecret; }
    public String successUrl() { return successUrl; }
    public String cancelUrl() { return cancelUrl; }
    public boolean mockConfirmationEnabled() { return mockConfirmationEnabled; }
    private static String clean(String value) { return value == null ? "" : value.trim(); }
}
