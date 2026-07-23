package com.altaira.backend.service;

import com.altaira.backend.config.CommercialStripeProperties;
import com.altaira.backend.dto.clientinvitation.ClientInvitationResponse;
import com.altaira.backend.dto.clientinvitation.CreateClientInvitationRequest;
import com.altaira.backend.dto.commercial.CommercialFlowResponse;
import com.altaira.backend.dto.commercial.CreateCheckoutRequest;
import com.altaira.backend.dto.lead.LeadConversionResponse;
import com.altaira.backend.dto.provisioning.ProvisioningPlanResponse;
import com.altaira.backend.entity.*;
import com.altaira.backend.integration.stripe.StripeCheckoutGateway;
import com.altaira.backend.model.*;
import com.altaira.backend.provisioning.ProvisioningTrack;
import com.altaira.backend.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class CommercialFlowService {
    private static final List<String> SUCCESS_EVENTS = List.of(
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded"
    );

    private final ProvisioningPlanRepository planRepository;
    private final CommercialFlowRepository flowRepository;
    private final CommercialPaymentSessionRepository sessionRepository;
    private final CommercialPaymentEventRepository eventRepository;
    private final CommercialEmailLogRepository emailLogRepository;
    private final ClientWorkspaceRepository workspaceRepository;
    private final LeadConversionService conversionService;
    private final ClientManagementService clientManagementService;
    private final ClientInvitationService invitationService;
    private final ProvisioningExecutionService executionService;
    private final CommercialNotificationService notificationService;
    private final StripeCheckoutGateway stripeGateway;
    private final CommercialStripeProperties stripeProperties;
    private final ObjectMapper objectMapper;

    public CommercialFlowService(
            ProvisioningPlanRepository planRepository,
            CommercialFlowRepository flowRepository,
            CommercialPaymentSessionRepository sessionRepository,
            CommercialPaymentEventRepository eventRepository,
            CommercialEmailLogRepository emailLogRepository,
            ClientWorkspaceRepository workspaceRepository,
            LeadConversionService conversionService,
            ClientManagementService clientManagementService,
            ClientInvitationService invitationService,
            ProvisioningExecutionService executionService,
            CommercialNotificationService notificationService,
            StripeCheckoutGateway stripeGateway,
            CommercialStripeProperties stripeProperties,
            ObjectMapper objectMapper
    ) {
        this.planRepository = planRepository;
        this.flowRepository = flowRepository;
        this.sessionRepository = sessionRepository;
        this.eventRepository = eventRepository;
        this.emailLogRepository = emailLogRepository;
        this.workspaceRepository = workspaceRepository;
        this.conversionService = conversionService;
        this.clientManagementService = clientManagementService;
        this.invitationService = invitationService;
        this.executionService = executionService;
        this.notificationService = notificationService;
        this.stripeGateway = stripeGateway;
        this.stripeProperties = stripeProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public CommercialFlowResponse getFlow(UUID planId) {
        ProvisioningPlanEntity plan = findPlan(planId);
        return flowRepository.findByPlan(plan)
                .map(flow -> map(plan, flow, "Commercial flow loaded."))
                .orElseGet(() -> emptyResponse(plan));
    }

    public CommercialFlowResponse createCheckout(UUID planId, CreateCheckoutRequest request) {
        ProvisioningPlanEntity plan = findPlan(planId);
        requireApproved(plan);
        CommercialFlowEntity flow = ensureFlow(plan);

        String currency = request.getCurrency().trim().toUpperCase(Locale.ROOT);
        String description = request.getDescription() == null || request.getDescription().isBlank()
                ? "Altaira Labs approved service plan"
                : request.getDescription().trim();
        String baseIdempotencyKey = "checkout:" + plan.getId() + ":" + request.getAmountMinor() + ":" + currency;
        CommercialPaymentSessionEntity matchingSession = sessionRepository
                .findAllByFlowOrderByCreatedAtDesc(flow)
                .stream()
                .filter(session -> session.getAmountMinor() == request.getAmountMinor())
                .filter(session -> currency.equals(session.getCurrency()))
                .findFirst()
                .orElse(null);
        if (matchingSession != null && !isTerminal(matchingSession)) {
            return map(plan, flow, "Existing payment session reused.");
        }
        String idempotencyKey = matchingSession == null
                ? baseIdempotencyKey
                : baseIdempotencyKey + ":retry:" + matchingSession.getId();

        if (sessionRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
            return map(plan, flow, "Existing payment retry reused.");
        }

        StripeCheckoutGateway.CheckoutResult checkout = stripeGateway.createCheckout(
                new StripeCheckoutGateway.CheckoutCommand(
                        flow.getId(), plan.getId(), request.getAmountMinor(), currency,
                        plan.getLead().getEmail(), description, idempotencyKey
                )
        );

        CommercialPaymentSessionEntity session = new CommercialPaymentSessionEntity();
        session.setFlow(flow);
        session.setProviderMode(checkout.providerMode());
        session.setStatus(CommercialPaymentStatus.PAYMENT_PENDING.name());
        session.setAmountMinor(request.getAmountMinor());
        session.setCurrency(currency);
        session.setCustomerEmail(plan.getLead().getEmail());
        session.setDescription(description);
        session.setProviderSessionId(checkout.providerSessionId());
        session.setCheckoutUrl(checkout.checkoutUrl());
        session.setPaymentIntentId(checkout.paymentIntentId());
        session.setExpiresAt(checkout.expiresAt());
        session.setIdempotencyKey(idempotencyKey);
        sessionRepository.save(session);

        flow.setPaymentStatus(checkout.checkoutUrl() == null
                ? CommercialPaymentStatus.PAYMENT_PENDING.name()
                : CommercialPaymentStatus.PAYMENT_LINK_CREATED.name());
        flowRepository.save(flow);
        notificationService.sendPaymentRequest(flow, checkout.checkoutUrl(), session.getAmountMinor(), session.getCurrency());
        return map(plan, flow, stripeProperties.isMock()
                ? "Mock checkout created. No payment or activation occurred."
                : "Stripe test checkout created.");
    }

    public CommercialFlowResponse confirmMock(UUID planId) {
        if (!stripeProperties.mockConfirmationEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mock payment confirmation is disabled");
        }
        ProvisioningPlanEntity plan = findPlan(planId);
        CommercialFlowEntity flow = flowRepository.findByPlan(plan)
                .orElseThrow(() -> new IllegalArgumentException("Create a mock checkout first"));
        CommercialPaymentSessionEntity session = latestSession(flow);
        if (!"mock".equals(session.getProviderMode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only mock sessions can use this confirmation endpoint");
        }
        confirmPayment(plan, flow, session);
        return map(plan, flow, "Mock payment confirmed and post-payment activation completed.");
    }

    public CommercialFlowResponse retryActivation(UUID planId) {
        ProvisioningPlanEntity plan = findPlan(planId);
        CommercialFlowEntity flow = flowRepository.findByPlan(plan)
                .orElseThrow(() -> new IllegalArgumentException("Commercial flow not found"));
        if (!CommercialPaymentStatus.PAYMENT_CONFIRMED.name().equals(flow.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment must be confirmed before activation can be retried");
        }
        activate(plan, flow);
        return map(plan, flow, "Post-payment activation retried.");
    }

    public CommercialFlowResponse retryNotifications(UUID planId) {
        ProvisioningPlanEntity plan = findPlan(planId);
        CommercialFlowEntity flow = flowRepository.findByPlan(plan)
                .orElseThrow(() -> new IllegalArgumentException("Commercial flow not found"));
        CommercialPaymentSessionEntity session = latestSession(flow);
        if (!notificationService.isConfigured()) {
            return map(plan, flow, "Commercial email is not configured; no retry was attempted.");
        }
        int attempted = 0;

        if (session.getCheckoutUrl() != null && !session.getCheckoutUrl().isBlank()
                && !notificationService.wasSent(flow, "PAYMENT_REQUEST")) {
            notificationService.sendPaymentRequest(flow, session.getCheckoutUrl(), session.getAmountMinor(), session.getCurrency());
            attempted++;
        }
        if (CommercialPaymentStatus.PAYMENT_CONFIRMED.name().equals(flow.getPaymentStatus())) {
            if (!notificationService.wasSent(flow, "PAYMENT_CONFIRMED")) {
                notificationService.sendPaymentConfirmed(flow, plan);
                attempted++;
            }
            if (!notificationService.wasSent(flow, "PLAN_SUMMARY")) {
                notificationService.sendPlanSummary(flow, plan);
                attempted++;
            }
        }

        return map(plan, flow, attempted == 0
                ? "No pending commercial email is currently eligible for retry."
                : "Commercial email retry completed without duplicating successful deliveries.");
    }

    public void processStripeWebhook(String payload, String signature) {
        Event stripeEvent = stripeGateway.verifyWebhook(payload, signature);
        if (eventRepository.findByProviderEventId(stripeEvent.getId()).isPresent()) return;

        JsonNode object = readJson(payload).path("data").path("object");
        String providerSessionId = object.path("id").asText("");
        if (providerSessionId.isBlank()) {
            throw new IllegalArgumentException("Stripe event does not contain a Checkout Session id");
        }
        CommercialPaymentSessionEntity session = sessionRepository.findByProviderSessionId(providerSessionId)
                .orElseThrow(() -> new IllegalArgumentException("Stripe Checkout Session is not registered"));
        ProvisioningPlanEntity plan = session.getFlow().getPlan();
        CommercialFlowEntity flow = session.getFlow();

        CommercialPaymentEventEntity event = new CommercialPaymentEventEntity();
        event.setPaymentSession(session);
        event.setProviderEventId(stripeEvent.getId());
        event.setEventType(stripeEvent.getType());
        eventRepository.save(event);

        try {
            if (SUCCESS_EVENTS.contains(stripeEvent.getType())) {
                String paymentStatus = object.path("payment_status").asText("paid");
                if ("checkout.session.completed".equals(stripeEvent.getType()) && !"paid".equalsIgnoreCase(paymentStatus)) {
                    session.setStatus(CommercialPaymentStatus.PAYMENT_PENDING.name());
                    flow.setPaymentStatus(CommercialPaymentStatus.PAYMENT_PENDING.name());
                } else {
                    String paymentIntent = object.path("payment_intent").asText(null);
                    session.setPaymentIntentId(paymentIntent);
                    confirmPayment(plan, flow, session);
                }
            } else if ("checkout.session.async_payment_failed".equals(stripeEvent.getType())) {
                session.setStatus(CommercialPaymentStatus.PAYMENT_FAILED.name());
                flow.setPaymentStatus(CommercialPaymentStatus.PAYMENT_FAILED.name());
            } else if ("checkout.session.expired".equals(stripeEvent.getType())) {
                session.setStatus(CommercialPaymentStatus.PAYMENT_CANCELLED.name());
                flow.setPaymentStatus(CommercialPaymentStatus.PAYMENT_CANCELLED.name());
            }
            sessionRepository.save(session);
            flowRepository.save(flow);
            event.setStatus("PROCESSED");
            event.setProcessedAt(Instant.now());
        } catch (RuntimeException exception) {
            event.setStatus("FAILED");
            event.setSafeError("Post-payment processing failed and can be retried safely.");
            event.setProcessedAt(Instant.now());
            flow.setActivationError(event.getSafeError());
            flow.setProvisioningStatus(CommercialProvisioningStatus.PROVISIONING_FAILED.name());
            flowRepository.save(flow);
        }
        eventRepository.save(event);
    }

    private void confirmPayment(ProvisioningPlanEntity plan, CommercialFlowEntity flow, CommercialPaymentSessionEntity session) {
        if (CommercialPaymentStatus.PAYMENT_CONFIRMED.name().equals(flow.getPaymentStatus())) {
            activate(plan, flow);
            return;
        }
        Instant now = Instant.now();
        session.setStatus(CommercialPaymentStatus.PAYMENT_CONFIRMED.name());
        session.setConfirmedAt(now);
        flow.setPaymentStatus(CommercialPaymentStatus.PAYMENT_CONFIRMED.name());
        flow.setPaymentConfirmedAt(now);
        sessionRepository.save(session);
        flowRepository.saveAndFlush(flow);
        notificationService.sendPaymentConfirmed(flow, plan);
        notificationService.sendPlanSummary(flow, plan);
        activate(plan, flow);
    }

    private void activate(ProvisioningPlanEntity plan, CommercialFlowEntity flow) {
        List<String> serviceKeys = serviceKeys(plan);
        LeadConversionResponse conversion = conversionService.convertAfterConfirmedPayment(
                plan.getLead().getId(), serviceKeys, "Activated from confirmed commercial payment for plan " + plan.getId()
        );
        ClientEntity client = clientManagementService.findClientEntity(conversion.getClient().getId());
        ClientWorkspaceEntity workspace = workspaceRepository.findByClient(client)
                .orElseThrow(() -> new IllegalStateException("Client workspace was not created"));

        flow.setClient(client);
        flow.setWorkspace(workspace);
        flow.setClientStatus(CommercialClientStatus.CLIENT_ACTIVE.name());
        flow.setWorkspaceStatus(CommercialWorkspaceStatus.WORKSPACE_ACTIVE.name());
        flow.setActivatedAt(Instant.now());
        flow.setActivationError(null);
        flowRepository.saveAndFlush(flow);

        if (!CommercialInvitationStatus.INVITATION_SENT.name().equals(flow.getInvitationStatus())) {
            CreateClientInvitationRequest invitationRequest = new CreateClientInvitationRequest();
            invitationRequest.setEmail(client.getEmail());
            invitationRequest.setRole("client_user");
            ClientInvitationResponse invitation = invitationService.createInvitation(client.getId(), invitationRequest, null, "system", "commercial-payment");
            flow.setInvitationStatus(invitation.isEmailSent()
                    ? CommercialInvitationStatus.INVITATION_SENT.name()
                    : CommercialInvitationStatus.INVITATION_FAILED.name());
            if (invitation.isEmailSent()) flow.setInvitationSentAt(Instant.now());
        }

        flow.setProvisioningStatus(CommercialProvisioningStatus.PROVISIONING_RUNNING.name());
        flowRepository.saveAndFlush(flow);
        ProvisioningRunEntity run = executionService.createDryRun(plan, client, workspace);
        boolean blocked = "BLOCKED".equals(run.getStatus());
        flow.setProvisioningStatus(blocked
                ? CommercialProvisioningStatus.PROVISIONING_BLOCKED.name()
                : CommercialProvisioningStatus.PROVISIONING_COMPLETED.name());
        plan.setStatus(blocked ? ProvisioningPlanStatus.PARTIALLY_COMPLETED.value() : ProvisioningPlanStatus.PROVISIONED.value());
        planRepository.save(plan);
        flowRepository.save(flow);
    }

    private CommercialFlowEntity ensureFlow(ProvisioningPlanEntity plan) {
        return flowRepository.findByPlan(plan).orElseGet(() -> {
            CommercialFlowEntity flow = new CommercialFlowEntity();
            flow.setPlan(plan);
            flow.setLead(plan.getLead());
            return flowRepository.save(flow);
        });
    }

    private CommercialPaymentSessionEntity latestSession(CommercialFlowEntity flow) {
        return sessionRepository.findAllByFlowOrderByCreatedAtDesc(flow).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Payment session not found"));
    }

    private boolean isTerminal(CommercialPaymentSessionEntity session) {
        return CommercialPaymentStatus.PAYMENT_FAILED.name().equals(session.getStatus())
                || CommercialPaymentStatus.PAYMENT_CANCELLED.name().equals(session.getStatus());
    }

    private CommercialFlowResponse map(ProvisioningPlanEntity plan, CommercialFlowEntity flow, String message) {
        CommercialPaymentSessionEntity session = sessionRepository.findAllByFlowOrderByCreatedAtDesc(flow).stream().findFirst().orElse(null);
        CommercialFlowResponse.PaymentSession payment = session == null ? null : new CommercialFlowResponse.PaymentSession(
                session.getId(), session.getProviderMode(), session.getStatus(), session.getAmountMinor(), session.getCurrency(),
                session.getCheckoutUrl(), session.getConfirmedAt()
        );
        List<CommercialFlowResponse.EmailDelivery> emailDeliveries = emailLogRepository
                .findAllByFlowOrderByCreatedAtDesc(flow)
                .stream()
                .map(log -> new CommercialFlowResponse.EmailDelivery(
                        log.getId(), log.getEmailType(), log.getRecipient(), log.getStatus(), log.getSafeError(),
                        log.getCreatedAt(), log.getSentAt()
                ))
                .toList();
        return new CommercialFlowResponse(
                flow.getId(), plan.getId(), plan.getLead().getId(),
                flow.getClient() == null ? null : flow.getClient().getId(),
                flow.getWorkspace() == null ? null : flow.getWorkspace().getId(),
                flow.getPaymentStatus(), flow.getClientStatus(), flow.getWorkspaceStatus(), flow.getInvitationStatus(),
                flow.getProvisioningStatus(), isApproved(plan), stripeProperties.useRealTestApi(), stripeProperties.isMock(),
                stripeProperties.mockConfirmationEnabled(), false,
                payment, executionService.mapLatest(plan), emailDeliveries, message,
                flow.getPaymentConfirmedAt(), flow.getActivatedAt()
        );
    }

    private CommercialFlowResponse emptyResponse(ProvisioningPlanEntity plan) {
        return new CommercialFlowResponse(
                null, plan.getId(), plan.getLead().getId(), null, null,
                CommercialPaymentStatus.PAYMENT_NOT_STARTED.name(), CommercialClientStatus.CLIENT_DRAFT.name(),
                CommercialWorkspaceStatus.WORKSPACE_PENDING.name(), CommercialInvitationStatus.INVITATION_PENDING.name(),
                CommercialProvisioningStatus.PROVISIONING_PENDING.name(), isApproved(plan), stripeProperties.useRealTestApi(),
                stripeProperties.isMock(), stripeProperties.mockConfirmationEnabled(), false, null, null,
                List.of(), "No payment session has been created.", null, null
        );
    }

    private List<String> serviceKeys(ProvisioningPlanEntity plan) {
        List<String> fromTracks = readTracks(plan.getTracksJson()).stream()
                .map(ProvisioningPlanResponse.Track::track)
                .map(String::toUpperCase)
                .map(ProvisioningTrack::valueOf)
                .map(ProvisioningTrack::serviceKey)
                .distinct()
                .toList();
        if (!fromTracks.isEmpty()) return fromTracks;
        try {
            return objectMapper.readValue(plan.getAssessment().getRecommendedServicesJson(), new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Approved plan has no readable service selection", exception);
        }
    }

    private List<ProvisioningPlanResponse.Track> readTracks(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("Provisioning tracks could not be read", exception); }
    }

    private JsonNode readJson(String payload) {
        try { return objectMapper.readTree(payload); }
        catch (JsonProcessingException exception) { throw new IllegalArgumentException("Stripe webhook payload is invalid", exception); }
    }

    private ProvisioningPlanEntity findPlan(UUID planId) {
        return planRepository.findById(planId).orElseThrow(() -> new IllegalArgumentException("Provisioning plan not found: " + planId));
    }
    private void requireApproved(ProvisioningPlanEntity plan) {
        if (!isApproved(plan)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Provisioning plan must be approved before payment");
    }
    private boolean isApproved(ProvisioningPlanEntity plan) {
        return List.of(ProvisioningPlanStatus.APPROVED.value(), ProvisioningPlanStatus.PROVISIONED.value(), ProvisioningPlanStatus.PARTIALLY_COMPLETED.value()).contains(plan.getStatus());
    }
}
