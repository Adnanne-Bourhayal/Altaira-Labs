package com.altaira.backend.service;

import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.model.ClientCrmLeadPriority;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ClientCrmLeadNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(ClientCrmLeadNotificationService.class);
    private static final long MIN_TIMEOUT_MS = 250;

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String resendApiKey;
    private final URI resendApiUrl;
    private final String notificationFrom;
    private final String dashboardUrl;
    private final long timeoutMs;
    private final HttpClient httpClient;

    public ClientCrmLeadNotificationService(
            ObjectMapper objectMapper,
            @Value("${altaira.client-crm.alerts.enabled:true}") boolean enabled,
            @Value("${altaira.client-crm.alerts.resend.api-key:}") String resendApiKey,
            @Value("${altaira.client-crm.alerts.resend.api-url:https://api.resend.com/emails}") String resendApiUrl,
            @Value("${altaira.client-crm.alerts.from:}") String notificationFrom,
            @Value("${altaira.client-crm.alerts.dashboard-url:}") String dashboardUrl,
            @Value("${altaira.client-crm.alerts.timeout-ms:6000}") long timeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.resendApiKey = resendApiKey == null ? "" : resendApiKey.trim();
        this.resendApiUrl = URI.create((resendApiUrl == null || resendApiUrl.isBlank()) ? "https://api.resend.com/emails" : resendApiUrl.trim());
        this.notificationFrom = notificationFrom == null ? "" : notificationFrom.trim();
        this.dashboardUrl = dashboardUrl == null ? "" : dashboardUrl.trim();
        this.timeoutMs = Math.max(MIN_TIMEOUT_MS, timeoutMs);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(this.timeoutMs))
                .build();

        logger.info(
                "Client CRM lead alert config: enabled={}, resendApiUrl={}, resendApiKeyConfigured={}, fromConfigured={}, dashboardUrlConfigured={}, timeoutMs={}",
                enabled,
                this.resendApiUrl,
                !this.resendApiKey.isBlank(),
                !this.notificationFrom.isBlank(),
                !this.dashboardUrl.isBlank(),
                this.timeoutMs
        );
    }

    public EmailNotificationResult sendUrgentWebhookLeadAlert(
            ClientCrmLeadEntity lead,
            String initialNote,
            Map<String, String> sectorFields
    ) {
        if (!ClientCrmLeadPriority.URGENT.value().equals(normalize(lead.getPriority()))) {
            return EmailNotificationResult.notSent("Client CRM lead is not urgent.");
        }

        ClientEntity client = lead.getClient();
        if (!enabled) {
            logger.info("Client CRM urgent lead alert skipped for lead {} because alerts are disabled.", lead.getId());
            return EmailNotificationResult.notSent("Client CRM lead alerts are disabled.");
        }

        if (resendApiKey.isBlank() || notificationFrom.isBlank()) {
            logger.warn(
                    "Client CRM urgent lead alert is not configured for lead {}. resendApiKeyConfigured={}, fromConfigured={}",
                    lead.getId(),
                    !resendApiKey.isBlank(),
                    !notificationFrom.isBlank()
            );
            return EmailNotificationResult.notSent("Client CRM lead alert email is not configured.");
        }

        if (client.getEmail() == null || client.getEmail().isBlank()) {
            logger.warn("Client CRM urgent lead alert skipped for lead {} because client email is blank.", lead.getId());
            return EmailNotificationResult.notSent("Client email is not configured.");
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(resendApiUrl)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(buildResendPayload(lead, client, initialNote, sectorFields)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Client CRM urgent lead alert sent for lead {} to client {}.", lead.getId(), client.getId());
                return EmailNotificationResult.success();
            }

            logger.warn(
                    "Client CRM urgent lead alert API request failed for lead {}. status={}, resendApiUrl={}, responseBody={}",
                    lead.getId(),
                    response.statusCode(),
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(response.body())
            );
            return EmailNotificationResult.notSent("Client CRM lead alert API request failed.");
        } catch (IOException ex) {
            logger.warn(
                    "Client CRM urgent lead alert API connection failed for lead {}. resendApiUrl={}, rootMessage={}",
                    lead.getId(),
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(ex.getMessage())
            );
            return EmailNotificationResult.notSent("Client CRM lead alert API connection failed.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            logger.warn("Client CRM urgent lead alert was interrupted for lead {}.", lead.getId());
            return EmailNotificationResult.notSent("Client CRM lead alert was interrupted.");
        } catch (IllegalArgumentException ex) {
            logger.warn("Client CRM urgent lead alert payload is invalid for lead {}. message={}", lead.getId(), safeLogValue(ex.getMessage()));
            return EmailNotificationResult.notSent("Client CRM lead alert payload is invalid.");
        }
    }

    private String buildResendPayload(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            String initialNote,
            Map<String, String> sectorFields
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", notificationFrom);
        payload.put("to", List.of(client.getEmail().trim()));

        String replyTo = cleanHeader(lead.getEmail());
        if (!replyTo.isBlank()) {
            payload.put("reply_to", replyTo);
        }

        payload.put("subject", "Urgent new Altaira CRM lead: " + cleanSubject(lead.getFullName()));
        payload.put("text", buildTextBody(lead, client, initialNote, sectorFields));
        payload.put("html", buildHtmlBody(lead, client, initialNote, sectorFields));

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not serialize client CRM alert payload", ex);
        }
    }

    private String buildTextBody(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            String initialNote,
            Map<String, String> sectorFields
    ) {
        return """
                Urgent lead received in your Altaira client CRM

                Client: %s
                Lead ID: %s
                Name: %s
                Email: %s
                Phone: %s
                Source: %s
                Sector: %s
                Priority: %s
                Created at: %s

                Sector fields:
                %s

                Message / note:
                %s

                Open your workspace:
                %s
                """.formatted(
                safe(client.getCompany()),
                safe(lead.getId()),
                safe(lead.getFullName()),
                safe(lead.getEmail()),
                safe(lead.getPhone()),
                safe(lead.getSource()),
                safe(lead.getSectorType()),
                safe(lead.getPriority()),
                safe(lead.getCreatedAt()),
                sectorFieldsText(sectorFields),
                safe(initialNote),
                leadDashboardUrl(lead, client)
        );
    }

    private String buildHtmlBody(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            String initialNote,
            Map<String, String> sectorFields
    ) {
        String dashboardLink = leadDashboardUrl(lead, client);
        String action = dashboardLink.isBlank()
                ? "<p style=\"margin:8px 0 0;color:#cbd5e1;\">Open your Altaira client workspace to review and update this lead.</p>"
                : "<p style=\"margin:8px 0 18px;color:#cbd5e1;\">Open your Altaira client workspace to review and update this lead.</p>" +
                "<a href=\"" + escapeHtml(dashboardLink) + "\" style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:13px 18px;font-weight:700;border-radius:0;\">Open CRM lead</a>";

        return """
                <!doctype html>
                <html lang="en">
                  <body style="margin:0;padding:0;background:#e5e7eb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#e5e7eb;padding:28px 0;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #cbd5e1;">
                            <tr>
                              <td style="background:#020617;color:#ffffff;padding:24px 28px;border-bottom:4px solid #7c3aed;">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td align="left" style="font-size:16px;letter-spacing:0.22em;font-weight:700;color:#ffffff;">ALTAIRA LABS</td>
                                    <td align="right">
                                      <span style="display:inline-block;border:1px solid #93c5fd;padding:7px 10px;color:#bfdbfe;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Urgent lead</span>
                                    </td>
                                  </tr>
                                </table>
                                <p style="margin:28px 0 10px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">Client CRM Alert</p>
                                <h1 style="margin:0;font-size:30px;line-height:1.18;letter-spacing:0;">New urgent lead received</h1>
                                <p style="margin:14px 0 0;color:#cbd5e1;font-size:15px;line-height:1.6;">A website or external form sent an urgent lead into the %s CRM pipeline.</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:24px 28px;">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #dbe3ef;margin-bottom:22px;">
                                  <tr>
                                    <td style="padding:16px 18px;background:#f8fafc;border-bottom:1px solid #dbe3ef;">
                                      <p style="margin:0;color:#475569;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Lead summary</p>
                                      <h2 style="margin:8px 0 0;color:#0f172a;font-size:22px;line-height:1.25;">%s</h2>
                                      <p style="margin:8px 0 0;color:#475569;font-size:14px;">%s</p>
                                    </td>
                                  </tr>
                                </table>

                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #dbe3ef;">
                                  %s
                                </table>

                                <div style="margin-top:24px;padding:18px;border-left:4px solid #7c3aed;background:#f8fafc;">
                                  <p style="margin:0 0 8px;color:#475569;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Message / note</p>
                                  <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.7;">%s</p>
                                </div>

                                <div style="margin-top:24px;padding:20px;background:#020617;border:1px solid #2563eb;">
                                  <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Recommended next step</p>
                                  %s
                                </div>

                                <p style="margin:18px 0 0;color:#64748b;font-size:12px;line-height:1.6;">This notification was generated from your Altaira Labs client CRM webhook intake.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                escapeHtml(safe(client.getCompany())),
                escapeHtml(safe(lead.getFullName())),
                escapeHtml(summaryLine(lead)),
                leadRows(lead, sectorFields),
                escapeHtml(safe(initialNote)).replace("\n", "<br>"),
                action
        );
    }

    private String leadRows(ClientCrmLeadEntity lead, Map<String, String> sectorFields) {
        StringBuilder rows = new StringBuilder();
        rows.append(htmlRow("Lead ID", safe(lead.getId())));
        rows.append(htmlRow("Name", safe(lead.getFullName())));
        rows.append(htmlRow("Email", safe(lead.getEmail())));
        rows.append(htmlRow("Phone", safe(lead.getPhone())));
        rows.append(htmlRow("Source", safe(lead.getSource())));
        rows.append(htmlRow("Sector", safe(lead.getSectorType())));
        rows.append(htmlRow("Priority", safe(lead.getPriority())));
        rows.append(htmlRow("Created at", safe(lead.getCreatedAt())));

        if (sectorFields != null && !sectorFields.isEmpty()) {
            sectorFields.forEach((key, value) -> rows.append(htmlRow(humanize(key), value)));
        }

        return rows.toString();
    }

    private String htmlRow(String label, String value) {
        return """
                <tr>
                  <td style="width:180px;padding:12px 14px;border-bottom:1px solid #dbe3ef;background:#f8fafc;color:#475569;font-size:13px;font-weight:700;">%s</td>
                  <td style="padding:12px 14px;border-bottom:1px solid #dbe3ef;color:#0f172a;font-size:14px;">%s</td>
                </tr>
                """.formatted(escapeHtml(label), escapeHtml(value));
    }

    private String sectorFieldsText(Map<String, String> sectorFields) {
        if (sectorFields == null || sectorFields.isEmpty()) {
            return "(none)";
        }

        StringBuilder builder = new StringBuilder();
        sectorFields.forEach((key, value) -> builder
                .append("- ")
                .append(humanize(key))
                .append(": ")
                .append(safe(value))
                .append("\n"));
        return builder.toString().trim();
    }

    private String leadDashboardUrl(ClientCrmLeadEntity lead, ClientEntity client) {
        if (dashboardUrl.isBlank()) {
            return "";
        }

        return dashboardUrl
                .replace("{leadId}", safe(lead.getId()))
                .replace("{clientId}", safe(client.getId()));
    }

    private String summaryLine(ClientCrmLeadEntity lead) {
        String email = safe(lead.getEmail());
        String phone = safe(lead.getPhone());
        if (!email.isBlank() && !phone.isBlank()) {
            return email + " | " + phone;
        }
        return email.isBlank() ? phone : email;
    }

    private String cleanSubject(String value) {
        String cleaned = safe(value).replaceAll("[\\r\\n]+", " ").trim();
        if (cleaned.isBlank()) {
            return "Client CRM lead";
        }
        return cleaned.length() > 80 ? cleaned.substring(0, 80) : cleaned;
    }

    private String cleanHeader(String value) {
        return safe(value).replaceAll("[\\r\\n]+", "").trim();
    }

    private String humanize(String value) {
        String cleaned = safe(value).replace("_", " ").trim();
        if (cleaned.isBlank()) {
            return "";
        }

        return cleaned.substring(0, 1).toUpperCase(Locale.ROOT) + cleaned.substring(1);
    }

    private String normalize(String value) {
        return safe(value).trim().toLowerCase(Locale.ROOT);
    }

    private String escapeHtml(String value) {
        return safe(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String safe(Object value) {
        return value == null ? "" : value.toString();
    }

    private String safeLogValue(String value) {
        if (value == null || value.isBlank()) {
            return "(blank)";
        }

        String cleaned = value.replaceAll("[\\r\\n\\t]+", " ").trim();
        return cleaned.length() > 240 ? cleaned.substring(0, 240) + "..." : cleaned;
    }
}
