package com.altaira.backend.service;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.OnboardingTaskEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
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
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OnboardingNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingNotificationService.class);

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String resendApiKey;
    private final URI resendApiUrl;
    private final String notificationFrom;
    private final String adminTo;
    private final HttpClient httpClient;

    public OnboardingNotificationService(
            ObjectMapper objectMapper,
            @Value("${altaira.onboarding.email.enabled:true}") boolean enabled,
            @Value("${altaira.onboarding.email.resend.api-key:}") String resendApiKey,
            @Value("${altaira.onboarding.email.resend.api-url:https://api.resend.com/emails}") String resendApiUrl,
            @Value("${altaira.onboarding.email.from:}") String notificationFrom,
            @Value("${altaira.onboarding.email.admin-to:altairalabs@gmail.com}") String adminTo
    ) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.resendApiKey = resendApiKey == null ? "" : resendApiKey.trim();
        this.resendApiUrl = URI.create((resendApiUrl == null || resendApiUrl.isBlank()) ? "https://api.resend.com/emails" : resendApiUrl.trim());
        this.notificationFrom = notificationFrom == null ? "" : notificationFrom.trim();
        this.adminTo = adminTo == null ? "" : adminTo.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        logger.info(
                "Onboarding email config: enabled={}, resendApiUrl={}, resendApiKeyConfigured={}, fromConfigured={}, adminToConfigured={}",
                enabled,
                this.resendApiUrl,
                !this.resendApiKey.isBlank(),
                !this.notificationFrom.isBlank(),
                !this.adminTo.isBlank()
        );
    }

    public EmailNotificationResult sendContractSubmitted(ClientEntity client, OnboardingTaskEntity task, byte[] signedPdf) {
        if (!isConfigured()) {
            return EmailNotificationResult.notSent("Onboarding email notification is not configured.");
        }

        try {
            sendEmail(
                    client.getEmail(),
                    "Your Altaira Labs service agreement was received",
                    contractClientHtml(client, task),
                    signedPdf == null ? List.of() : List.of(pdfAttachment("altaira-signed-agreement-evidence.pdf", signedPdf))
            );

            if (!adminTo.isBlank()) {
                sendEmail(
                        adminTo,
                        "Altaira onboarding contract signed: " + cleanSubject(client.getCompany()),
                        contractAdminHtml(client, task),
                        signedPdf == null ? List.of() : List.of(pdfAttachment("altaira-signed-agreement-evidence.pdf", signedPdf))
                );
            }

            return EmailNotificationResult.success();
        } catch (RuntimeException ex) {
            logger.warn("Onboarding contract email could not be sent for client {}", client.getId(), ex);
            return EmailNotificationResult.notSent("Onboarding contract email could not be sent.");
        }
    }

    public EmailNotificationResult sendOnboardingReadyForReview(ClientEntity client) {
        if (!isConfigured()) {
            return EmailNotificationResult.notSent("Onboarding email notification is not configured.");
        }

        try {
            if (!adminTo.isBlank()) {
                sendEmail(
                        adminTo,
                        "Altaira onboarding ready for review: " + cleanSubject(client.getCompany()),
                        onboardingCompleteAdminHtml(client),
                        List.of()
                );
            }

            sendEmail(
                    client.getEmail(),
                    "We received your onboarding information",
                    onboardingCompleteClientHtml(client),
                    List.of()
            );

            return EmailNotificationResult.success();
        } catch (RuntimeException ex) {
            logger.warn("Onboarding completion email could not be sent for client {}", client.getId(), ex);
            return EmailNotificationResult.notSent("Onboarding completion email could not be sent.");
        }
    }

    public EmailNotificationResult sendClientInvitation(ClientEntity client, String invitationUrl) {
        if (!isConfigured()) {
            return EmailNotificationResult.notSent("Client invitation email is not configured.");
        }

        try {
            sendEmail(
                    client.getEmail(),
                    "Your Altaira Labs client workspace is ready",
                    clientInvitationHtml(client, invitationUrl),
                    List.of()
            );

            return EmailNotificationResult.success();
        } catch (RuntimeException ex) {
            logger.warn("Client invitation email could not be sent for client {}", client.getId(), ex);
            return EmailNotificationResult.notSent("Client invitation email could not be sent.");
        }
    }

    private boolean isConfigured() {
        return enabled && !resendApiKey.isBlank() && !notificationFrom.isBlank();
    }

    private void sendEmail(String to, String subject, String html, List<Map<String, Object>> attachments) {
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("Email recipient is required");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", notificationFrom);
        payload.put("to", List.of(to.trim()));
        payload.put("subject", subject);
        payload.put("html", html);

        if (!attachments.isEmpty()) {
            payload.put("attachments", attachments);
        }

        HttpRequest request = HttpRequest.newBuilder(resendApiUrl)
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(toJson(payload)))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn("Resend onboarding email failed. status={}, body={}", response.statusCode(), safeBody(response.body()));
                throw new IllegalStateException("Resend onboarding email failed with status " + response.statusCode());
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Resend onboarding email request failed", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Resend onboarding email request interrupted", ex);
        }
    }

    private Map<String, Object> pdfAttachment(String filename, byte[] pdf) {
        Map<String, Object> attachment = new LinkedHashMap<>();
        attachment.put("filename", filename);
        attachment.put("content", Base64.getEncoder().encodeToString(pdf));
        return attachment;
    }

    private String contractClientHtml(ClientEntity client, OnboardingTaskEntity task) {
        return emailShell(
                "Contract received",
                "Thanks for trusting Altaira Labs.",
                "<p>Your service agreement was submitted successfully.</p>" +
                        "<p><strong>Signer:</strong> " + escape(task.getSignatureFullName()) + "</p>" +
                        "<p><strong>Document ID:</strong> " + escape(task.getSignatureDocumentId()) + "</p>" +
                        "<p><strong>Signed at:</strong> " + escape(task.getSignedAt()) + "</p>"
        );
    }

    private String contractAdminHtml(ClientEntity client, OnboardingTaskEntity task) {
        return emailShell(
                "Client contract signed",
                escape(client.getCompany()) + " submitted the legal onboarding task.",
                "<p><strong>Client:</strong> " + escape(client.getCompany()) + "</p>" +
                        "<p><strong>Signer:</strong> " + escape(task.getSignatureFullName()) + "</p>" +
                        "<p><strong>Document ID:</strong> " + escape(task.getSignatureDocumentId()) + "</p>" +
                        "<p><strong>Signed at:</strong> " + escape(task.getSignedAt()) + "</p>"
        );
    }

    private String onboardingCompleteAdminHtml(ClientEntity client) {
        return emailShell(
                "Onboarding ready for review",
                escape(client.getCompany()) + " submitted all required onboarding tasks.",
                "<p>Review the client onboarding materials in the admin workspace before approving project work.</p>"
        );
    }

    private String onboardingCompleteClientHtml(ClientEntity client) {
        return emailShell(
                "Onboarding information received",
                "Our team has received your onboarding information.",
                "<p>We will review the submitted information and move your project forward from the Altaira workspace.</p>"
        );
    }

    private String clientInvitationHtml(ClientEntity client, String invitationUrl) {
        return emailShell(
                "Client workspace access",
                "Your private Altaira Labs workspace is ready.",
                "<p>Use the secure invitation link below to activate your account and start onboarding.</p>" +
                        "<p style=\"margin:24px 0;\"><a href=\"" + escape(invitationUrl) + "\" style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;\">Activate client workspace</a></p>" +
                        "<p>This link is private and expires automatically. If you did not expect this invitation, contact Altaira Labs.</p>"
        );
    }

    private String emailShell(String label, String title, String body) {
        return """
                <div style="margin:0;padding:32px;background:#e5e7eb;font-family:Arial,sans-serif;color:#020617;">
                  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;">
                    <div style="background:#050814;color:#ffffff;padding:28px 32px;border-bottom:4px solid #2563eb;">
                      <div style="letter-spacing:0.2em;text-transform:uppercase;font-size:12px;color:#bfdbfe;">Altaira Labs</div>
                      <h1 style="margin:18px 0 0;font-size:28px;line-height:1.2;">%s</h1>
                      <p style="margin:10px 0 0;color:#cbd5e1;">%s</p>
                    </div>
                    <div style="padding:28px 32px;">
                      <div style="letter-spacing:0.18em;text-transform:uppercase;font-size:11px;color:#2563eb;font-weight:700;">%s</div>
                      <div style="margin-top:18px;font-size:15px;line-height:1.7;color:#334155;">%s</div>
                    </div>
                  </div>
                </div>
                """.formatted(escape(title), escape(label), escape(label), body);
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not serialize onboarding email payload", ex);
        }
    }

    private String cleanSubject(String value) {
        if (value == null || value.isBlank()) {
            return "client";
        }

        return value.replaceAll("[\\r\\n]+", " ").trim();
    }

    private String safeBody(String value) {
        if (value == null) {
            return "";
        }

        return value.length() <= 500 ? value : value.substring(0, 500);
    }

    private String escape(Object value) {
        String raw = value == null ? "" : String.valueOf(value);
        return raw
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
