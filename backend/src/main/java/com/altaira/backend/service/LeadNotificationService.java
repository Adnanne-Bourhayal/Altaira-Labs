package com.altaira.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.altaira.backend.entity.LeadEntity;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class LeadNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(LeadNotificationService.class);
    private static final long MIN_TIMEOUT_MS = 250;
    private static final String EMAIL_PROVIDER_SMTP = "smtp";
    private static final String EMAIL_PROVIDER_RESEND = "resend";

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectMapper objectMapper;
    private final ExecutorService emailExecutor;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String emailProvider;
    private final String notificationTo;
    private final String notificationFrom;
    private final long notificationTimeoutMs;
    private final String resendApiKey;
    private final URI resendApiUrl;
    private final String smtpHost;
    private final int smtpPort;
    private final String smtpUsername;
    private final boolean smtpAuthEnabled;
    private final boolean smtpStartTlsEnabled;
    private final boolean smtpStartTlsRequired;

    public LeadNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            ObjectMapper objectMapper,
            @Value("${altaira.contact.email.enabled:true}") boolean enabled,
            @Value("${altaira.contact.email.provider:smtp}") String emailProvider,
            @Value("${altaira.contact.email.to:altairalabs@gmail.com}") String notificationTo,
            @Value("${altaira.contact.email.from:}") String notificationFrom,
            @Value("${altaira.contact.email.timeout-ms:6000}") long notificationTimeoutMs,
            @Value("${altaira.contact.email.resend.api-key:}") String resendApiKey,
            @Value("${altaira.contact.email.resend.api-url:https://api.resend.com/emails}") String resendApiUrl,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${spring.mail.port:587}") int smtpPort,
            @Value("${spring.mail.username:}") String smtpUsername,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuthEnabled,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean smtpStartTlsEnabled,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean smtpStartTlsRequired
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.objectMapper = objectMapper;
        this.emailExecutor = Executors.newVirtualThreadPerTaskExecutor();
        this.enabled = enabled;
        this.emailProvider = normalizeProvider(emailProvider);
        this.notificationTo = notificationTo;
        this.notificationFrom = notificationFrom;
        this.notificationTimeoutMs = Math.max(MIN_TIMEOUT_MS, notificationTimeoutMs);
        this.resendApiKey = resendApiKey == null ? "" : resendApiKey.trim();
        this.resendApiUrl = parseResendApiUrl(resendApiUrl);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(this.notificationTimeoutMs))
                .build();
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.smtpUsername = smtpUsername;
        this.smtpAuthEnabled = smtpAuthEnabled;
        this.smtpStartTlsEnabled = smtpStartTlsEnabled;
        this.smtpStartTlsRequired = smtpStartTlsRequired;

        logger.info(
                "Lead email notification config: enabled={}, provider={}, resendApiUrl={}, resendApiKeyConfigured={}, smtpHost={}, smtpPort={}, smtpUsername={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, notificationFrom={}, notificationTo={}, timeoutMs={}",
                enabled,
                this.emailProvider,
                safeLogValue(this.resendApiUrl.toString()),
                !this.resendApiKey.isBlank(),
                safeLogValue(smtpHost),
                smtpPort,
                safeLogValue(smtpUsername),
                smtpAuthEnabled,
                smtpStartTlsEnabled,
                smtpStartTlsRequired,
                safeLogValue(notificationFrom),
                safeLogValue(notificationTo),
                this.notificationTimeoutMs
        );
    }

    public EmailNotificationResult sendLeadCreatedNotification(LeadEntity lead) {
        if (!enabled) {
            logger.info("Lead email notification skipped for lead {} because email notifications are disabled.", lead.getId());
            return EmailNotificationResult.notSent("Email notification is disabled.");
        }

        if (notificationTo == null || notificationTo.isBlank()) {
            logger.warn("Lead email notification recipient is blank for lead {}.", lead.getId());
            return EmailNotificationResult.notSent("Email notification recipient is not configured.");
        }

        Future<EmailNotificationResult> emailTask;
        if (EMAIL_PROVIDER_RESEND.equals(emailProvider)) {
            EmailNotificationResult configurationResult = validateResendConfiguration(lead);
            if (configurationResult != null) {
                return configurationResult;
            }
            emailTask = emailExecutor.submit(() -> sendResendEmail(lead));
        } else if (EMAIL_PROVIDER_SMTP.equals(emailProvider)) {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                logger.warn(
                        "Lead email notification is not configured for lead {}. provider={}, smtpHost={}, smtpPort={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                        lead.getId(),
                        emailProvider,
                        safeLogValue(smtpHost),
                        smtpPort,
                        safeLogValue(smtpUsername),
                        safeLogValue(notificationFrom),
                        safeLogValue(notificationTo)
                );
                return EmailNotificationResult.notSent("Email notification is not configured.");
            }
            emailTask = emailExecutor.submit(() -> sendSmtpEmail(mailSender, lead));
        } else {
            logger.warn("Lead email notification provider is unsupported for lead {}. provider={}", lead.getId(), safeLogValue(emailProvider));
            return EmailNotificationResult.notSent("Email provider is not supported. Check CONTACT_EMAIL_PROVIDER.");
        }

        try {
            return emailTask.get(notificationTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            emailTask.cancel(true);
            logger.warn(
                    "Lead email notification timed out after {} ms for lead {}. provider={}, resendApiUrl={}, smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    notificationTimeoutMs,
                    lead.getId(),
                    emailProvider,
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(smtpHost),
                    smtpPort,
                    smtpAuthEnabled,
                    smtpStartTlsEnabled,
                    smtpStartTlsRequired,
                    safeLogValue(smtpUsername),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );
            return EmailNotificationResult.notSent("Email notification timed out; lead was saved.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            logger.warn("Lead email notification was interrupted for lead {}", lead.getId(), ex);
            return EmailNotificationResult.notSent("Email notification was interrupted; lead was saved.");
        } catch (ExecutionException ex) {
            logger.warn("Lead email notification failed for lead {}", lead.getId(), ex.getCause());
            return EmailNotificationResult.notSent("Email notification could not be sent.");
        }
    }

    @PreDestroy
    void shutdownExecutor() {
        emailExecutor.shutdownNow();
    }

    private EmailNotificationResult sendSmtpEmail(JavaMailSender mailSender, LeadEntity lead) {
        try {
            logger.info(
                    "Sending lead email notification for lead {}. provider={}, smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    emailProvider,
                    safeLogValue(smtpHost),
                    smtpPort,
                    smtpAuthEnabled,
                    smtpStartTlsEnabled,
                    smtpStartTlsRequired,
                    safeLogValue(smtpUsername),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );

            SimpleMailMessage message = new SimpleMailMessage();
            if (notificationFrom != null && !notificationFrom.isBlank()) {
                message.setFrom(notificationFrom.trim());
            }
            message.setTo(notificationTo.trim());
            message.setReplyTo(cleanHeader(lead.getEmail()));
            message.setSubject("New Altaira Labs lead: " + cleanSubject(lead.getBusinessName()));
            message.setText(buildBody(lead));

            mailSender.send(message);
            logger.info("Lead email notification sent for lead {}", lead.getId());
            return EmailNotificationResult.success();
        } catch (MailException | IllegalArgumentException ex) {
            logger.warn(
                    "Lead email notification could not be sent for lead {}. provider={}, failureType={}, rootException={}, rootMessage={}, smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    emailProvider,
                    classifyFailure(ex),
                    rootCause(ex).getClass().getName(),
                    safeLogValue(rootMessage(ex)),
                    safeLogValue(smtpHost),
                    smtpPort,
                    smtpAuthEnabled,
                    smtpStartTlsEnabled,
                    smtpStartTlsRequired,
                    safeLogValue(smtpUsername),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );
            logger.debug("Lead email notification exception stack for lead {}", lead.getId(), ex);
            return EmailNotificationResult.notSent(describeFailure(ex));
        }
    }

    private EmailNotificationResult sendResendEmail(LeadEntity lead) {
        try {
            logger.info(
                    "Sending lead email notification for lead {}. provider={}, resendApiUrl={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    emailProvider,
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );

            HttpRequest request = HttpRequest.newBuilder(resendApiUrl)
                    .timeout(Duration.ofMillis(notificationTimeoutMs))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(buildResendPayload(lead)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Lead email notification sent for lead {} through Resend. status={}", lead.getId(), response.statusCode());
                return EmailNotificationResult.success();
            }

            logger.warn(
                    "Lead email notification API request failed for lead {}. provider={}, status={}, resendApiUrl={}, notificationFrom={}, notificationTo={}, responseBody={}",
                    lead.getId(),
                    emailProvider,
                    response.statusCode(),
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo),
                    safeLogValue(response.body())
            );
            return EmailNotificationResult.notSent(describeResendStatus(response.statusCode()));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            logger.warn("Lead email notification API request was interrupted for lead {}. provider={}", lead.getId(), emailProvider);
            return EmailNotificationResult.notSent("Email API request was interrupted; lead was saved.");
        } catch (IOException ex) {
            logger.warn(
                    "Lead email notification API connection failed for lead {}. provider={}, rootException={}, rootMessage={}, resendApiUrl={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    emailProvider,
                    rootCause(ex).getClass().getName(),
                    safeLogValue(rootMessage(ex)),
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );
            logger.debug("Lead email notification API exception stack for lead {}", lead.getId(), ex);
            return EmailNotificationResult.notSent("Email API connection failed. Check RESEND_API_KEY, Resend sender verification and Render outbound HTTPS access.");
        } catch (IllegalArgumentException ex) {
            logger.warn(
                    "Lead email notification API request is invalid for lead {}. provider={}, rootMessage={}, resendApiUrl={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    emailProvider,
                    safeLogValue(rootMessage(ex)),
                    safeLogValue(resendApiUrl.toString()),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );
            return EmailNotificationResult.notSent("Email API request is invalid. Check CONTACT_NOTIFICATION_FROM, CONTACT_NOTIFICATION_TO and Resend configuration.");
        }
    }

    private EmailNotificationResult validateResendConfiguration(LeadEntity lead) {
        if (resendApiKey.isBlank()) {
            logger.warn("Lead email notification API key is not configured for lead {}. provider={}", lead.getId(), emailProvider);
            return EmailNotificationResult.notSent("Email API key is not configured. Check RESEND_API_KEY.");
        }

        if (notificationFrom == null || notificationFrom.isBlank()) {
            logger.warn("Lead email notification sender is blank for lead {}. provider={}", lead.getId(), emailProvider);
            return EmailNotificationResult.notSent("Email sender is not configured. Check CONTACT_NOTIFICATION_FROM.");
        }

        return null;
    }

    private String buildResendPayload(LeadEntity lead) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", notificationFrom.trim());
        payload.put("to", List.of(notificationTo.trim()));

        String replyTo = cleanHeader(lead.getEmail());
        if (!replyTo.isBlank()) {
            payload.put("reply_to", replyTo);
        }

        payload.put("subject", "New Altaira Labs lead: " + cleanSubject(lead.getBusinessName()));
        payload.put("text", buildBody(lead));

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not build Resend email payload", ex);
        }
    }

    private String describeResendStatus(int statusCode) {
        if (statusCode == 401 || statusCode == 403) {
            return "Email API authentication failed. Check RESEND_API_KEY.";
        }

        if (statusCode == 400 || statusCode == 422) {
            return "Email API rejected the request. Check CONTACT_NOTIFICATION_FROM, CONTACT_NOTIFICATION_TO and Resend domain verification.";
        }

        if (statusCode == 429) {
            return "Email API rate limit reached. Check Resend usage limits.";
        }

        if (statusCode >= 500) {
            return "Email API provider is temporarily unavailable. Check Resend status/logs.";
        }

        return "Email API request failed. Check Resend configuration and provider logs.";
    }

    private String describeFailure(Exception ex) {
        String failureType = classifyFailure(ex);

        if ("authentication_failed".equals(failureType)) {
            return "Email authentication failed. Check Render SMTP username/password or Google App Password.";
        }

        if ("connection_failed".equals(failureType)) {
            return "Email SMTP connection failed. Check Render SMTP host, port, STARTTLS and outbound access.";
        }

        if ("invalid_address".equals(failureType)) {
            return "Email address configuration is invalid. Check CONTACT_NOTIFICATION_TO and CONTACT_NOTIFICATION_FROM.";
        }

        return "Email notification could not be sent. Check Render SMTP environment variables and backend logs.";
    }

    private String classifyFailure(Exception ex) {
        String details = failureDetails(ex);

        if (ex instanceof MailAuthenticationException
                || details.contains("authentication")
                || details.contains("authenticate")
                || details.contains("username")
                || details.contains("password")
                || details.contains("credentials")) {
            return "authentication_failed";
        }

        if (details.contains("connection")
                || details.contains("connect")
                || details.contains("timed out")
                || details.contains("timeout")
                || details.contains("refused")
                || details.contains("unknown host")) {
            return "connection_failed";
        }

        if (details.contains("invalid address") || details.contains("address failed")) {
            return "invalid_address";
        }

        return "unknown";
    }

    private String normalizeProvider(String value) {
        if (value == null || value.isBlank()) {
            return EMAIL_PROVIDER_SMTP;
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }

    private URI parseResendApiUrl(String value) {
        String apiUrl = value == null || value.isBlank()
                ? "https://api.resend.com/emails"
                : value.trim();
        return URI.create(apiUrl);
    }

    private String failureDetails(Exception ex) {
        return rootMessage(ex).toLowerCase(Locale.ROOT);
    }

    private Throwable rootCause(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }

        return root;
    }

    private String rootMessage(Throwable ex) {
        Throwable root = rootCause(ex);
        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            message = ex.getMessage();
        }

        return message == null ? "" : message;
    }

    private String buildBody(LeadEntity lead) {
        return """
                New public lead received.

                Lead ID: %s
                Name: %s
                Business: %s
                Email: %s
                Phone: %s
                Industry/context: %s
                Service/interest: %s
                Status: %s
                Created at: %s

                Message/goals:
                %s
                """.formatted(
                safe(lead.getId()),
                safe(lead.getFullName()),
                safe(lead.getBusinessName()),
                safe(lead.getEmail()),
                safe(lead.getPhone()),
                safe(lead.getIndustry()),
                safe(lead.getServiceInterest()),
                safe(lead.getStatus()),
                safe(lead.getCreatedAt()),
                safe(lead.getGoals())
        );
    }

    private String cleanSubject(String value) {
        String cleaned = safe(value).replaceAll("[\\r\\n]+", " ").trim();
        if (cleaned.isBlank()) {
            return "Website contact";
        }
        return cleaned.length() > 80 ? cleaned.substring(0, 80) : cleaned;
    }

    private String cleanHeader(String value) {
        return safe(value).replaceAll("[\\r\\n]+", "").trim();
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
