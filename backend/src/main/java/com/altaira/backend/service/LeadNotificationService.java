package com.altaira.backend.service;

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

import java.util.Locale;
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

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ExecutorService emailExecutor;
    private final boolean enabled;
    private final String notificationTo;
    private final String notificationFrom;
    private final long notificationTimeoutMs;
    private final String smtpHost;
    private final int smtpPort;
    private final String smtpUsername;
    private final boolean smtpAuthEnabled;
    private final boolean smtpStartTlsEnabled;
    private final boolean smtpStartTlsRequired;

    public LeadNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${altaira.contact.email.enabled:true}") boolean enabled,
            @Value("${altaira.contact.email.to:altairalabs@gmail.com}") String notificationTo,
            @Value("${altaira.contact.email.from:}") String notificationFrom,
            @Value("${altaira.contact.email.timeout-ms:6000}") long notificationTimeoutMs,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${spring.mail.port:587}") int smtpPort,
            @Value("${spring.mail.username:}") String smtpUsername,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuthEnabled,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean smtpStartTlsEnabled,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean smtpStartTlsRequired
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.emailExecutor = Executors.newVirtualThreadPerTaskExecutor();
        this.enabled = enabled;
        this.notificationTo = notificationTo;
        this.notificationFrom = notificationFrom;
        this.notificationTimeoutMs = Math.max(MIN_TIMEOUT_MS, notificationTimeoutMs);
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.smtpUsername = smtpUsername;
        this.smtpAuthEnabled = smtpAuthEnabled;
        this.smtpStartTlsEnabled = smtpStartTlsEnabled;
        this.smtpStartTlsRequired = smtpStartTlsRequired;

        logger.info(
                "Lead email notification config: enabled={}, smtpHost={}, smtpPort={}, smtpUsername={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, notificationFrom={}, notificationTo={}, timeoutMs={}",
                enabled,
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

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            logger.warn(
                    "Lead email notification is not configured for lead {}. smtpHost={}, smtpPort={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
                    safeLogValue(smtpHost),
                    smtpPort,
                    safeLogValue(smtpUsername),
                    safeLogValue(notificationFrom),
                    safeLogValue(notificationTo)
            );
            return EmailNotificationResult.notSent("Email notification is not configured.");
        }

        if (notificationTo == null || notificationTo.isBlank()) {
            logger.warn("Lead email notification recipient is blank for lead {}.", lead.getId());
            return EmailNotificationResult.notSent("Email notification recipient is not configured.");
        }

        Future<EmailNotificationResult> emailTask = emailExecutor.submit(() -> sendEmail(mailSender, lead));

        try {
            return emailTask.get(notificationTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            emailTask.cancel(true);
            logger.warn(
                    "Lead email notification timed out after {} ms for lead {}. smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    notificationTimeoutMs,
                    lead.getId(),
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

    private EmailNotificationResult sendEmail(JavaMailSender mailSender, LeadEntity lead) {
        try {
            logger.info(
                    "Sending lead email notification for lead {}. smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
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
                    "Lead email notification could not be sent for lead {}. failureType={}, rootException={}, rootMessage={}, smtpHost={}, smtpPort={}, smtpAuthEnabled={}, smtpStartTlsEnabled={}, smtpStartTlsRequired={}, smtpUsername={}, notificationFrom={}, notificationTo={}",
                    lead.getId(),
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
