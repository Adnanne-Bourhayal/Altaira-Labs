package com.altaira.backend.service;

import com.altaira.backend.entity.LeadEntity;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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

    public LeadNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${altaira.contact.email.enabled:true}") boolean enabled,
            @Value("${altaira.contact.email.to:altairalabs@gmail.com}") String notificationTo,
            @Value("${altaira.contact.email.from:}") String notificationFrom,
            @Value("${altaira.contact.email.timeout-ms:6000}") long notificationTimeoutMs
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.emailExecutor = Executors.newVirtualThreadPerTaskExecutor();
        this.enabled = enabled;
        this.notificationTo = notificationTo;
        this.notificationFrom = notificationFrom;
        this.notificationTimeoutMs = Math.max(MIN_TIMEOUT_MS, notificationTimeoutMs);
    }

    public EmailNotificationResult sendLeadCreatedNotification(LeadEntity lead) {
        if (!enabled) {
            return EmailNotificationResult.notSent("Email notification is disabled.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return EmailNotificationResult.notSent("Email notification is not configured.");
        }

        if (notificationTo == null || notificationTo.isBlank()) {
            return EmailNotificationResult.notSent("Email notification recipient is not configured.");
        }

        Future<EmailNotificationResult> emailTask = emailExecutor.submit(() -> sendEmail(mailSender, lead));

        try {
            return emailTask.get(notificationTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            emailTask.cancel(true);
            logger.warn("Lead email notification timed out after {} ms for lead {}", notificationTimeoutMs, lead.getId());
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
            SimpleMailMessage message = new SimpleMailMessage();
            if (notificationFrom != null && !notificationFrom.isBlank()) {
                message.setFrom(notificationFrom.trim());
            }
            message.setTo(notificationTo.trim());
            message.setReplyTo(cleanHeader(lead.getEmail()));
            message.setSubject("New Altaira Labs lead: " + cleanSubject(lead.getBusinessName()));
            message.setText(buildBody(lead));

            mailSender.send(message);
            return EmailNotificationResult.success();
        } catch (MailException | IllegalArgumentException ex) {
            logger.warn("Lead email notification could not be sent for lead {}", lead.getId(), ex);
            return EmailNotificationResult.notSent("Email notification could not be sent.");
        }
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
}
