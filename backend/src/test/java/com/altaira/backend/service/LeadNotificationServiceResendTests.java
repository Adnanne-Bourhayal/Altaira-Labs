package com.altaira.backend.service;

import com.altaira.backend.entity.LeadEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LeadNotificationServiceResendTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @SuppressWarnings("unchecked")
    void sendsResendEmailWithLeadContextAndDoesNotUseSmtpProvider() throws Exception {
        AtomicReference<String> authorizationHeader = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();

        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/emails", exchange -> {
            authorizationHeader.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes()));

            byte[] response = "{\"id\":\"email_test\"}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        ObjectProvider<JavaMailSender> mailSenderProvider = Mockito.mock(ObjectProvider.class);
        LeadNotificationService service = resendService(
                mailSenderProvider,
                "re_test_key",
                "http://localhost:" + server.getAddress().getPort() + "/emails"
        );

        try {
            EmailNotificationResult result = service.sendLeadCreatedNotification(testLead());

            assertTrue(result.sent());
            assertEquals("Email notification sent.", result.message());
            Mockito.verify(mailSenderProvider, Mockito.never()).getIfAvailable();
            assertEquals("Bearer re_test_key", authorizationHeader.get());

            JsonNode payload = objectMapper.readTree(requestBody.get());
            assertEquals("onboarding@resend.dev", payload.get("from").asText());
            assertEquals(List.of("altairalabs@gmail.com"), objectMapper.convertValue(payload.get("to"), List.class));
            assertEquals("marta@example.com", payload.get("reply_to").asText());
            assertEquals("New Altaira Labs lead: Ruiz Dental Studio", payload.get("subject").asText());

            String emailBody = payload.get("text").asText();
            assertTrue(emailBody.contains("Lead ID: 73fb0d01-fdc8-4264-8421-a5192251401c"));
            assertTrue(emailBody.contains("Name: Marta Ruiz"));
            assertTrue(emailBody.contains("Business: Ruiz Dental Studio"));
            assertTrue(emailBody.contains("Email: marta@example.com"));
            assertTrue(emailBody.contains("Phone: +32 470 44 55 66"));
            assertTrue(emailBody.contains("Industry/context: Clinics"));
            assertTrue(emailBody.contains("Service/interest: Booking Systems"));
            assertTrue(emailBody.contains("Status: new"));
            assertTrue(emailBody.contains("Created at: 2026-07-14T10:15:30Z"));
            assertTrue(emailBody.contains("Needs appointment requests and patient follow-up."));
        } finally {
            service.shutdownExecutor();
            server.stop(0);
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void reportsMissingResendApiKeyWithoutUsingSmtp() {
        ObjectProvider<JavaMailSender> mailSenderProvider = Mockito.mock(ObjectProvider.class);
        LeadNotificationService service = resendService(
                mailSenderProvider,
                "",
                "https://api.resend.com/emails"
        );

        try {
            EmailNotificationResult result = service.sendLeadCreatedNotification(testLead());

            assertFalse(result.sent());
            assertEquals("Email API key is not configured. Check RESEND_API_KEY.", result.message());
            Mockito.verify(mailSenderProvider, Mockito.never()).getIfAvailable();
        } finally {
            service.shutdownExecutor();
        }
    }

    private LeadNotificationService resendService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            String apiKey,
            String apiUrl
    ) {
        return new LeadNotificationService(
                mailSenderProvider,
                objectMapper,
                true,
                "resend",
                "altairalabs@gmail.com",
                "onboarding@resend.dev",
                5000,
                apiKey,
                apiUrl,
                "smtp.gmail.com",
                587,
                "altairalabs@gmail.com",
                true,
                true,
                true
        );
    }

    private LeadEntity testLead() {
        LeadEntity lead = new LeadEntity();
        lead.setId(UUID.fromString("73fb0d01-fdc8-4264-8421-a5192251401c"));
        lead.setFullName("Marta Ruiz");
        lead.setBusinessName("Ruiz Dental Studio");
        lead.setEmail("marta@example.com");
        lead.setPhone("+32 470 44 55 66");
        lead.setIndustry("Clinics");
        lead.setServiceInterest("Booking Systems");
        lead.setGoals("Needs appointment requests and patient follow-up.");
        lead.setStatus("new");
        lead.setCreatedAt(Instant.parse("2026-07-14T10:15:30Z"));
        return lead;
    }
}
