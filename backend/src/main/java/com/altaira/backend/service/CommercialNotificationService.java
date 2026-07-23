package com.altaira.backend.service;

import com.altaira.backend.entity.CommercialEmailLogEntity;
import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.repository.CommercialEmailLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CommercialNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(CommercialNotificationService.class);

    private final CommercialEmailLogRepository emailLogRepository;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String apiKey;
    private final URI apiUrl;
    private final String from;
    private final HttpClient httpClient;
    private final Duration requestTimeout;

    public CommercialNotificationService(
            CommercialEmailLogRepository emailLogRepository,
            ObjectMapper objectMapper,
            @Value("${altaira.commercial.email.enabled:false}") boolean enabled,
            @Value("${altaira.commercial.email.resend.api-key:}") String apiKey,
            @Value("${altaira.commercial.email.resend.api-url:https://api.resend.com/emails}") String apiUrl,
            @Value("${altaira.commercial.email.from:}") String from,
            @Value("${altaira.commercial.email.timeout-ms:6000}") long timeoutMs
    ) {
        this.emailLogRepository = emailLogRepository;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.apiKey = clean(apiKey);
        this.apiUrl = URI.create(clean(apiUrl).isBlank() ? "https://api.resend.com/emails" : clean(apiUrl));
        this.from = clean(from);
        this.requestTimeout = Duration.ofMillis(Math.max(timeoutMs, 1000));
        this.httpClient = HttpClient.newBuilder().connectTimeout(this.requestTimeout).build();
        logger.info("Commercial email config: enabled={}, apiKeyConfigured={}, fromConfigured={}", enabled, !this.apiKey.isBlank(), !this.from.isBlank());
    }

    public NotificationResult sendPaymentRequest(
            CommercialFlowEntity flow,
            String checkoutUrl,
            long amountMinor,
            String currency
    ) {
        if (checkoutUrl == null || checkoutUrl.isBlank()) {
            return logSkipped(flow, "PAYMENT_REQUEST", flow.getLead().getEmail(), "Mock checkout has no customer payment URL.");
        }
        String amount = String.format(Locale.ROOT, "%.2f %s", amountMinor / 100.0, currency);
        String body = "<p>Your Altaira Labs proposal is ready for payment.</p>" +
                "<p><strong>Amount:</strong> " + escape(amount) + "</p>" +
                "<p style=\"margin:24px 0\"><a href=\"" + escape(checkoutUrl) + "\" style=\"background:#2563eb;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700\">Open secure checkout</a></p>";
        return send(flow, "PAYMENT_REQUEST", flow.getLead().getEmail(), "Your Altaira Labs payment link", emailShell("Payment request", body));
    }

    public NotificationResult sendPaymentConfirmed(CommercialFlowEntity flow, ProvisioningPlanEntity plan) {
        String body = "<p>Payment has been confirmed. Your client workspace is being prepared.</p>" +
                "<p><strong>Solution route:</strong> " + escape(plan.getRouteKey()) + "</p>" +
                "<p><strong>Automation level:</strong> " + escape(plan.getAutomationLevel()) + "</p>" +
                "<p>You will receive a separate secure invitation to activate your workspace.</p>";
        return send(flow, "PAYMENT_CONFIRMED", flow.getLead().getEmail(), "Payment confirmed - Altaira Labs", emailShell("Payment confirmed", body));
    }

    public NotificationResult sendPlanSummary(CommercialFlowEntity flow, ProvisioningPlanEntity plan) {
        String body = "<p>Here is the approved delivery summary linked to your payment.</p>" +
                "<p><strong>Business:</strong> " + escape(flow.getLead().getBusinessName()) + "</p>" +
                "<p><strong>Solution route:</strong> " + escape(plan.getRouteKey()) + "</p>" +
                "<p><strong>Automation level:</strong> " + escape(plan.getAutomationLevel()) + "</p>" +
                "<p><strong>Scope:</strong> " + escape(plan.getAutomationScope()) + "</p>" +
                "<p>The detailed tracks, tasks and delivery resources will be available in your private workspace.</p>";
        return send(flow, "PLAN_SUMMARY", flow.getLead().getEmail(), "Your Altaira Labs delivery plan", emailShell("Approved plan summary", body));
    }

    public boolean wasSent(CommercialFlowEntity flow, String type) {
        return emailLogRepository.existsByFlowAndEmailTypeAndStatus(flow, type, "SENT");
    }

    public boolean isConfigured() {
        return configured();
    }

    private NotificationResult send(CommercialFlowEntity flow, String type, String recipient, String subject, String html) {
        if (!configured()) {
            return logSkipped(flow, type, recipient, "Commercial email is not configured.");
        }

        CommercialEmailLogEntity log = baseLog(flow, type, recipient);
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", from);
            payload.put("to", List.of(recipient));
            payload.put("subject", subject);
            payload.put("html", html);

            HttpRequest request = HttpRequest.newBuilder(apiUrl)
                    .timeout(requestTimeout)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Resend returned status " + response.statusCode());
            }

            log.setStatus("SENT");
            log.setProviderMessageId(readMessageId(response.body()));
            log.setSentAt(Instant.now());
            emailLogRepository.save(log);
            return new NotificationResult(true, "Email sent.");
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
            logger.warn("Commercial email {} failed for flow {}", type, flow.getId(), exception);
            log.setStatus("FAILED");
            log.setSafeError("Commercial email could not be sent.");
            emailLogRepository.save(log);
            return new NotificationResult(false, log.getSafeError());
        } catch (RuntimeException exception) {
            logger.warn("Commercial email {} failed for flow {}", type, flow.getId(), exception);
            log.setStatus("FAILED");
            log.setSafeError("Commercial email could not be sent.");
            emailLogRepository.save(log);
            return new NotificationResult(false, log.getSafeError());
        }
    }

    private NotificationResult logSkipped(CommercialFlowEntity flow, String type, String recipient, String reason) {
        CommercialEmailLogEntity log = baseLog(flow, type, recipient);
        log.setStatus("SKIPPED");
        log.setSafeError(reason);
        emailLogRepository.save(log);
        return new NotificationResult(false, reason);
    }

    private CommercialEmailLogEntity baseLog(CommercialFlowEntity flow, String type, String recipient) {
        CommercialEmailLogEntity log = new CommercialEmailLogEntity();
        log.setFlow(flow);
        log.setEmailType(type);
        log.setRecipient(recipient);
        log.setStatus("PENDING");
        return log;
    }

    private String readMessageId(String body) {
        try {
            JsonNode id = objectMapper.readTree(body).path("id");
            return id.isTextual() ? id.asText() : null;
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private boolean configured() { return enabled && !apiKey.isBlank() && !from.isBlank(); }
    private String emailShell(String title, String body) {
        return "<div style=\"padding:32px;background:#e5e7eb;font-family:Arial,sans-serif\"><div style=\"max-width:640px;margin:auto;background:#fff;border:1px solid #dbe3ef\"><div style=\"padding:28px 32px;background:#050814;color:#fff;border-bottom:4px solid #2563eb\"><div style=\"letter-spacing:.2em;font-size:12px;color:#bfdbfe\">ALTAIRA LABS</div><h1 style=\"margin:18px 0 0\">" + escape(title) + "</h1></div><div style=\"padding:28px 32px;color:#334155;line-height:1.7\">" + body + "</div></div></div>";
    }
    private String escape(Object value) { return String.valueOf(value == null ? "" : value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }
    private static String clean(String value) { return value == null ? "" : value.trim(); }
    public record NotificationResult(boolean sent, String message) {}
}
