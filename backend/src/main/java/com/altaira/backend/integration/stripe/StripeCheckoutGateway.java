package com.altaira.backend.integration.stripe;

import com.altaira.backend.config.CommercialStripeProperties;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class StripeCheckoutGateway {
    private final CommercialStripeProperties properties;

    public StripeCheckoutGateway(CommercialStripeProperties properties) {
        this.properties = properties;
    }

    public CheckoutResult createCheckout(CheckoutCommand command) {
        if (properties.isMock()) {
            String id = "mock_cs_" + UUID.randomUUID().toString().replace("-", "");
            return new CheckoutResult(id, null, null, Instant.now().plusSeconds(1800), "mock");
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(properties.successUrl() + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(properties.cancelUrl())
                .setClientReferenceId(command.flowId().toString())
                .setCustomerEmail(command.customerEmail())
                .putMetadata("commercialFlowId", command.flowId().toString())
                .putMetadata("provisioningPlanId", command.planId().toString())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(command.currency().toLowerCase())
                                .setUnitAmount(command.amountMinor())
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(command.description())
                                        .build())
                                .build())
                        .build())
                .build();

        RequestOptions options = RequestOptions.builder()
                .setApiKey(properties.secretKey())
                .setIdempotencyKey(command.idempotencyKey())
                .build();

        try {
            Session session = Session.create(params, options);
            Instant expiresAt = session.getExpiresAt() == null ? null : Instant.ofEpochSecond(session.getExpiresAt());
            return new CheckoutResult(session.getId(), session.getUrl(), session.getPaymentIntent(), expiresAt, "test");
        } catch (StripeException exception) {
            throw new IllegalStateException("Stripe test checkout could not be created", exception);
        }
    }

    public Event verifyWebhook(String payload, String signature) {
        if (properties.webhookSecret().isBlank()) {
            throw new IllegalStateException("Stripe webhook verification is not configured");
        }
        try {
            return Webhook.constructEvent(payload, signature, properties.webhookSecret());
        } catch (SignatureVerificationException exception) {
            throw new IllegalArgumentException("Invalid Stripe webhook signature", exception);
        }
    }

    public CommercialStripeProperties properties() { return properties; }

    public record CheckoutCommand(
            UUID flowId,
            UUID planId,
            long amountMinor,
            String currency,
            String customerEmail,
            String description,
            String idempotencyKey
    ) {}

    public record CheckoutResult(
            String providerSessionId,
            String checkoutUrl,
            String paymentIntentId,
            Instant expiresAt,
            String providerMode
    ) {}
}
