package com.altaira.backend.service;

import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.CommercialEmailLogEntity;
import com.altaira.backend.entity.CommercialFlowEntity;
import com.altaira.backend.entity.LeadEntity;
import com.altaira.backend.entity.ProvisioningPlanEntity;
import com.altaira.backend.repository.CommercialEmailLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class CommercialEmailSequenceTests {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void rendersAndSendsTheFourCommercialEmailsThroughLocalResendStub() throws Exception {
        List<String> authorizationHeaders = new CopyOnWriteArrayList<>();
        List<String> requestBodies = new CopyOnWriteArrayList<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/emails", exchange -> {
            authorizationHeaders.add(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBodies.add(new String(exchange.getRequestBody().readAllBytes()));
            byte[] response = ("{\"id\":\"email_test_" + requestBodies.size() + "\"}").getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        CommercialEmailLogRepository logRepository = Mockito.mock(CommercialEmailLogRepository.class);
        List<CommercialEmailLogEntity> savedLogs = new ArrayList<>();
        Mockito.when(logRepository.save(any(CommercialEmailLogEntity.class))).thenAnswer(invocation -> {
            CommercialEmailLogEntity log = invocation.getArgument(0);
            savedLogs.add(log);
            return log;
        });

        String apiUrl = "http://localhost:" + server.getAddress().getPort() + "/emails";
        CommercialNotificationService commercialEmails = new CommercialNotificationService(
                logRepository,
                objectMapper,
                true,
                "re_test_key",
                apiUrl,
                "onboarding@resend.dev",
                5000
        );
        OnboardingNotificationService onboardingEmails = new OnboardingNotificationService(
                objectMapper,
                true,
                "re_test_key",
                apiUrl,
                "onboarding@resend.dev",
                "altairalabs@gmail.com"
        );

        LeadEntity lead = new LeadEntity();
        lead.setFullName("Marta Ruiz");
        lead.setBusinessName("Ruiz Dental & Studio");
        lead.setEmail("marta@example.com");

        ProvisioningPlanEntity plan = new ProvisioningPlanEntity();
        plan.setRouteKey("COMPOSITE");
        plan.setAutomationLevel("A1");
        plan.setAutomationScope("Web, Booking and CRM");

        CommercialFlowEntity flow = new CommercialFlowEntity();
        flow.setLead(lead);
        flow.setPlan(plan);

        ClientEntity client = new ClientEntity();
        client.setName("Marta Ruiz");
        client.setCompany("Ruiz Dental & Studio");
        client.setEmail("marta@example.com");

        try {
            assertThat(commercialEmails.sendPaymentRequest(
                    flow,
                    "https://checkout.stripe.test/session?id=123&mode=test",
                    150000,
                    "EUR"
            ).sent()).isTrue();
            assertThat(commercialEmails.sendPaymentConfirmed(flow, plan).sent()).isTrue();
            assertThat(commercialEmails.sendPlanSummary(flow, plan).sent()).isTrue();
            assertThat(onboardingEmails.sendClientInvitation(
                    client,
                    "https://altaira.test/client/activate?token=test-only"
            ).sent()).isTrue();

            assertThat(requestBodies).hasSize(4);
            assertThat(authorizationHeaders).containsOnly("Bearer re_test_key");

            JsonNode paymentRequest = objectMapper.readTree(requestBodies.get(0));
            assertEmail(paymentRequest, "Your Altaira Labs payment link", "Payment request");
            assertThat(paymentRequest.path("html").asText())
                    .contains("1500.00 EUR")
                    .contains("Open secure checkout")
                    .contains("https://checkout.stripe.test/session?id=123&amp;mode=test");

            JsonNode paymentConfirmed = objectMapper.readTree(requestBodies.get(1));
            assertEmail(paymentConfirmed, "Payment confirmed - Altaira Labs", "Payment confirmed");
            assertThat(paymentConfirmed.path("html").asText()).contains("COMPOSITE").contains("A1");

            JsonNode planSummary = objectMapper.readTree(requestBodies.get(2));
            assertEmail(planSummary, "Your Altaira Labs delivery plan", "Approved plan summary");
            assertThat(planSummary.path("html").asText())
                    .contains("Ruiz Dental &amp; Studio")
                    .contains("Web, Booking and CRM");

            JsonNode invitation = objectMapper.readTree(requestBodies.get(3));
            assertEmail(invitation, "Your Altaira Labs client workspace is ready", "Client workspace access");
            assertThat(invitation.path("html").asText())
                    .contains("Activate client workspace")
                    .contains("https://altaira.test/client/activate?token=test-only");

            verify(logRepository, times(3)).save(any(CommercialEmailLogEntity.class));
            assertThat(savedLogs)
                    .extracting(CommercialEmailLogEntity::getEmailType)
                    .containsExactly("PAYMENT_REQUEST", "PAYMENT_CONFIRMED", "PLAN_SUMMARY");
            assertThat(savedLogs).allMatch(log -> "SENT".equals(log.getStatus()));
            assertThat(savedLogs).allMatch(log -> log.getProviderMessageId() != null);
        } finally {
            server.stop(0);
        }
    }

    private void assertEmail(JsonNode payload, String subject, String expectedHtml) {
        assertThat(payload.path("from").asText()).isEqualTo("onboarding@resend.dev");
        assertThat(payload.path("to").get(0).asText()).isEqualTo("marta@example.com");
        assertThat(payload.path("subject").asText()).isEqualTo(subject);
        assertThat(payload.path("html").asText())
                .containsIgnoringCase("Altaira Labs")
                .contains(expectedHtml);
    }
}
