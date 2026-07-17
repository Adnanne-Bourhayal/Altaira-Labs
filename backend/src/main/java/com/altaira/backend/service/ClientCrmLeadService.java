package com.altaira.backend.service;

import com.altaira.backend.dto.clientcrm.AddClientCrmLeadNoteRequest;
import com.altaira.backend.dto.clientcrm.ClientCrmFollowUpActionResponse;
import com.altaira.backend.dto.clientcrm.ClientCrmLeadEventResponse;
import com.altaira.backend.dto.clientcrm.ClientCrmLeadNoteResponse;
import com.altaira.backend.dto.clientcrm.ClientCrmLeadResponse;
import com.altaira.backend.dto.clientcrm.CreateClientCrmFollowUpActionRequest;
import com.altaira.backend.dto.clientcrm.CreateClientCrmLeadRequest;
import com.altaira.backend.dto.clientcrm.UpdateClientCrmFollowUpActionStatusRequest;
import com.altaira.backend.dto.clientcrm.UpdateClientCrmLeadStatusRequest;
import com.altaira.backend.dto.onboarding.OnboardingDashboardResponse;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientCrmFollowUpActionEntity;
import com.altaira.backend.entity.ClientCrmLeadEntity;
import com.altaira.backend.entity.ClientCrmLeadEventEntity;
import com.altaira.backend.entity.ClientCrmLeadNoteEntity;
import com.altaira.backend.entity.ClientCrmWebhookTokenEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.ClientCrmLeadPriority;
import com.altaira.backend.model.ClientCrmLeadStatus;
import com.altaira.backend.model.ClientServiceStatus;
import com.altaira.backend.repository.ClientCrmFollowUpActionRepository;
import com.altaira.backend.repository.ClientCrmLeadNoteRepository;
import com.altaira.backend.repository.ClientCrmLeadRepository;
import com.altaira.backend.repository.ClientCrmLeadEventRepository;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.security.ClientAccessContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class ClientCrmLeadService {

    private static final TypeReference<Map<String, String>> SECTOR_FIELDS_TYPE = new TypeReference<>() {};

    private final ClientCrmLeadRepository clientCrmLeadRepository;
    private final ClientCrmFollowUpActionRepository clientCrmFollowUpActionRepository;
    private final ClientCrmLeadNoteRepository clientCrmLeadNoteRepository;
    private final ClientCrmLeadEventRepository clientCrmLeadEventRepository;
    private final ClientRepository clientRepository;
    private final ClientServiceRepository clientServiceRepository;
    private final OnboardingService onboardingService;
    private final OnboardingTemplateService onboardingTemplateService;
    private final ClientCrmLeadNotificationService leadNotificationService;
    private final ObjectMapper objectMapper;

    public ClientCrmLeadService(
            ClientCrmLeadRepository clientCrmLeadRepository,
            ClientCrmFollowUpActionRepository clientCrmFollowUpActionRepository,
            ClientCrmLeadNoteRepository clientCrmLeadNoteRepository,
            ClientCrmLeadEventRepository clientCrmLeadEventRepository,
            ClientRepository clientRepository,
            ClientServiceRepository clientServiceRepository,
            OnboardingService onboardingService,
            OnboardingTemplateService onboardingTemplateService,
            ClientCrmLeadNotificationService leadNotificationService,
            ObjectMapper objectMapper
    ) {
        this.clientCrmLeadRepository = clientCrmLeadRepository;
        this.clientCrmFollowUpActionRepository = clientCrmFollowUpActionRepository;
        this.clientCrmLeadNoteRepository = clientCrmLeadNoteRepository;
        this.clientCrmLeadEventRepository = clientCrmLeadEventRepository;
        this.clientRepository = clientRepository;
        this.clientServiceRepository = clientServiceRepository;
        this.onboardingService = onboardingService;
        this.onboardingTemplateService = onboardingTemplateService;
        this.leadNotificationService = leadNotificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ClientCrmLeadResponse> listClientLeads(ClientAccessContext context) {
        requireCrmAccess(context);

        return clientCrmLeadRepository.findAllByClientOrderByCreatedAtDesc(context.client())
                .stream()
                .map(this::mapLeadForClient)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientCrmLeadResponse getClientLead(ClientAccessContext context, UUID leadId) {
        requireCrmAccess(context);

        return mapLeadForClient(findLeadForClient(leadId, context.client()));
    }

    @Transactional(readOnly = true)
    public List<ClientCrmLeadResponse> listClientLeadsAsAdmin(UUID clientId) {
        ClientEntity client = findClient(clientId);

        return clientCrmLeadRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(this::mapLeadForAdmin)
                .toList();
    }

    public ClientCrmLeadResponse createClientLead(ClientAccessContext context, CreateClientCrmLeadRequest request) {
        requireCrmAccess(context);

        ClientCrmLeadEntity savedLead = createLead(
                context.client(),
                context.user(),
                request,
                request.getSource()
        );

        if (request.getInitialNote() != null && !request.getInitialNote().isBlank()) {
            createNote(savedLead, context.client(), context.user(), "client", request.getInitialNote(), true);
        }

        return mapLeadForClient(savedLead);
    }

    public ClientCrmLeadResponse createClientLeadFromWebhook(
            ClientCrmWebhookTokenEntity token,
            CreateClientCrmLeadRequest request
    ) {
        ClientEntity client = token.getClient();
        requireCrmServiceActive(client);

        ClientCrmLeadEntity savedLead = createLead(
                client,
                null,
                request,
                request.getSource() == null || request.getSource().isBlank() ? "website_webhook" : request.getSource()
        );

        String initialNote = request.getInitialNote();
        if (initialNote != null && !initialNote.isBlank()) {
            createNote(savedLead, client, null, "system", initialNote, true);
        }

        leadNotificationService.sendUrgentWebhookLeadAlert(
                savedLead,
                initialNote,
                readSectorFields(savedLead.getSectorFieldsJson())
        );

        return mapLeadForClient(savedLead);
    }

    private ClientCrmLeadEntity createLead(
            ClientEntity client,
            AppUserEntity createdByUser,
            CreateClientCrmLeadRequest request,
            String source
    ) {
        ClientCrmLeadEntity lead = new ClientCrmLeadEntity();
        lead.setClient(client);
        lead.setCreatedByUser(createdByUser);
        lead.setFullName(trimRequired(request.getFullName()));
        lead.setEmail(trimOptionalLowercase(request.getEmail()));
        lead.setPhone(trimOptional(request.getPhone()));
        lead.setSource(trimOptional(source));
        lead.setStatus(ClientCrmLeadStatus.NEW_LEAD.value());
        lead.setPriority(ClientCrmLeadPriority.parse(request.getPriority()).value());
        lead.setSectorType(client.getSectorType() == null || client.getSectorType().isBlank() ? "custom" : client.getSectorType());
        lead.setSectorFieldsJson(writeSectorFields(sanitizeSectorFields(request.getSectorFields())));

        ClientCrmLeadEntity savedLead = clientCrmLeadRepository.save(lead);
        createEvent(
                savedLead,
                client,
                createdByUser,
                createdByUser == null ? "system" : "client",
                "lead_created",
                null,
                savedLead.getStatus(),
                "Lead created from " + (source == null || source.isBlank() ? "manual input" : source)
        );

        return savedLead;
    }

    public ClientCrmLeadResponse updateClientLeadStatus(
            ClientAccessContext context,
            UUID leadId,
            UpdateClientCrmLeadStatusRequest request
    ) {
        requireCrmAccess(context);

        ClientCrmLeadEntity lead = findLeadForClient(leadId, context.client());
        String previousStatus = lead.getStatus();
        String nextStatus = ClientCrmLeadStatus.parse(request.getStatus()).value();
        lead.setStatus(nextStatus);
        ClientCrmLeadEntity savedLead = clientCrmLeadRepository.save(lead);
        createStatusEvent(savedLead, context.client(), context.user(), "client", previousStatus, nextStatus);

        return mapLeadForClient(savedLead);
    }

    public ClientCrmLeadResponse updateClientLeadStatusAsAdmin(
            UUID clientId,
            UUID leadId,
            AppUserEntity adminUser,
            UpdateClientCrmLeadStatusRequest request
    ) {
        ClientEntity client = findClient(clientId);
        ClientCrmLeadEntity lead = findLeadForClient(leadId, client);
        String previousStatus = lead.getStatus();
        String nextStatus = ClientCrmLeadStatus.parse(request.getStatus()).value();
        lead.setStatus(nextStatus);
        ClientCrmLeadEntity savedLead = clientCrmLeadRepository.save(lead);
        createStatusEvent(savedLead, client, adminUser, "admin", previousStatus, nextStatus);

        return mapLeadForAdmin(savedLead);
    }

    public ClientCrmLeadResponse addClientLeadNote(
            ClientAccessContext context,
            UUID leadId,
            AddClientCrmLeadNoteRequest request
    ) {
        requireCrmAccess(context);

        ClientCrmLeadEntity lead = findLeadForClient(leadId, context.client());
        createNote(lead, context.client(), context.user(), "client", request.getContent(), true);

        return mapLeadForClient(lead);
    }

    public ClientCrmLeadResponse addClientLeadNoteAsAdmin(
            UUID clientId,
            UUID leadId,
            AppUserEntity adminUser,
            AddClientCrmLeadNoteRequest request
    ) {
        ClientEntity client = findClient(clientId);
        ClientCrmLeadEntity lead = findLeadForClient(leadId, client);
        createNote(lead, client, adminUser, "admin", request.getContent(), Boolean.TRUE.equals(request.getVisibleToClient()));

        return mapLeadForAdmin(lead);
    }

    public ClientCrmLeadResponse createClientFollowUpAction(
            ClientAccessContext context,
            UUID leadId,
            CreateClientCrmFollowUpActionRequest request
    ) {
        requireCrmAccess(context);

        ClientCrmLeadEntity lead = findLeadForClient(leadId, context.client());
        createFollowUpAction(
                lead,
                context.client(),
                context.user(),
                "client",
                request,
                true
        );

        return mapLeadForClient(lead);
    }

    public ClientCrmLeadResponse createFollowUpActionAsAdmin(
            UUID clientId,
            UUID leadId,
            AppUserEntity adminUser,
            CreateClientCrmFollowUpActionRequest request
    ) {
        ClientEntity client = findClient(clientId);
        ClientCrmLeadEntity lead = findLeadForClient(leadId, client);
        createFollowUpAction(
                lead,
                client,
                adminUser,
                "admin",
                request,
                Boolean.TRUE.equals(request.getVisibleToClient())
        );

        return mapLeadForAdmin(lead);
    }

    public ClientCrmLeadResponse updateClientFollowUpActionStatus(
            ClientAccessContext context,
            UUID leadId,
            UUID actionId,
            UpdateClientCrmFollowUpActionStatusRequest request
    ) {
        requireCrmAccess(context);

        ClientCrmLeadEntity lead = findLeadForClient(leadId, context.client());
        ClientCrmFollowUpActionEntity action = findFollowUpActionForLead(actionId, lead);

        if (!isClientVisibleFollowUpAction(action)) {
            throw new ResourceNotFoundException("Client CRM follow-up action", actionId);
        }

        updateFollowUpActionStatus(action, context.user(), "client", request.getStatus());

        return mapLeadForClient(lead);
    }

    public ClientCrmLeadResponse updateFollowUpActionStatusAsAdmin(
            UUID clientId,
            UUID leadId,
            UUID actionId,
            AppUserEntity adminUser,
            UpdateClientCrmFollowUpActionStatusRequest request
    ) {
        ClientEntity client = findClient(clientId);
        ClientCrmLeadEntity lead = findLeadForClient(leadId, client);
        ClientCrmFollowUpActionEntity action = findFollowUpActionForLead(actionId, lead);
        updateFollowUpActionStatus(action, adminUser, "admin", request.getStatus());

        return mapLeadForAdmin(lead);
    }

    private void requireCrmAccess(ClientAccessContext context) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client CRM is locked until the service contract is approved"
            );
        }

        requireCrmServiceActive(context.client());
    }

    private void requireCrmServiceActive(ClientEntity client) {
        boolean crmActive = clientServiceRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .filter(this::isVisibleClientService)
                .map(onboardingTemplateService::serviceKey)
                .anyMatch("crm"::equals);

        if (!crmActive) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CRM module is not active for this client");
        }
    }

    private boolean isVisibleClientService(ClientServiceEntity assignment) {
        return assignment.getStatus() != null &&
                !ClientServiceStatus.CANCELLED.value().equals(assignment.getStatus());
    }

    private ClientCrmLeadEntity findLeadForClient(UUID leadId, ClientEntity client) {
        return clientCrmLeadRepository.findByIdAndClient(leadId, client)
                .orElseThrow(() -> new ResourceNotFoundException("Client CRM lead", leadId));
    }

    private ClientEntity findClient(UUID clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", clientId));
    }

    private ClientCrmFollowUpActionEntity findFollowUpActionForLead(UUID actionId, ClientCrmLeadEntity lead) {
        return clientCrmFollowUpActionRepository.findByIdAndLead(actionId, lead)
                .orElseThrow(() -> new ResourceNotFoundException("Client CRM follow-up action", actionId));
    }

    private void createFollowUpAction(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            AppUserEntity actorUser,
            String ownerRole,
            CreateClientCrmFollowUpActionRequest request,
            boolean visibleToClient
    ) {
        String normalizedOwnerRole = normalizeActorRole(ownerRole);

        ClientCrmFollowUpActionEntity action = new ClientCrmFollowUpActionEntity();
        action.setLead(lead);
        action.setClient(client);
        action.setCreatedByUser(actorUser);
        action.setOwnerRole(normalizedOwnerRole);
        action.setVisibleToClient(visibleToClient || "client".equals(normalizedOwnerRole) || "system".equals(normalizedOwnerRole));
        action.setTitle(trimToLimit(request.getTitle(), 180));
        action.setDescription(trimToLimit(request.getDescription(), 1200));
        action.setStatus("open");
        action.setDueAt(request.getDueAt());
        clientCrmFollowUpActionRepository.save(action);

        createEvent(
                lead,
                client,
                actorUser,
                normalizedOwnerRole,
                "follow_up_created",
                null,
                null,
                "Follow-up action created: " + action.getTitle()
        );
    }

    private void updateFollowUpActionStatus(
            ClientCrmFollowUpActionEntity action,
            AppUserEntity actorUser,
            String actorRole,
            String requestedStatus
    ) {
        String previousStatus = action.getStatus();
        String nextStatus = normalizeFollowUpStatus(requestedStatus);

        if (previousStatus != null && previousStatus.equals(nextStatus)) {
            return;
        }

        action.setStatus(nextStatus);
        action.setCompletedAt("done".equals(nextStatus) ? Instant.now() : null);
        ClientCrmFollowUpActionEntity savedAction = clientCrmFollowUpActionRepository.save(action);

        createEvent(
                savedAction.getLead(),
                savedAction.getClient(),
                actorUser,
                normalizeActorRole(actorRole),
                "follow_up_status_changed",
                previousStatus,
                nextStatus,
                "Follow-up action \"" + savedAction.getTitle() + "\" changed from " + previousStatus + " to " + nextStatus
        );
    }

    private void createNote(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            AppUserEntity authorUser,
            String actorRole,
            String content,
            boolean visibleToClient
    ) {
        String trimmedContent = trimToLimit(content, 1200);
        String normalizedActorRole = normalizeActorRole(actorRole);

        ClientCrmLeadNoteEntity note = new ClientCrmLeadNoteEntity();
        note.setLead(lead);
        note.setClient(client);
        note.setAuthorUser(authorUser);
        note.setAuthorRole(normalizedActorRole);
        note.setVisibleToClient(visibleToClient || "client".equals(normalizedActorRole) || "system".equals(normalizedActorRole));
        note.setContent(trimmedContent);
        clientCrmLeadNoteRepository.save(note);

        createEvent(
                lead,
                client,
                authorUser,
                normalizedActorRole,
                "note_added",
                null,
                null,
                trimmedContent
        );
    }

    private void createStatusEvent(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            AppUserEntity actorUser,
            String actorRole,
            String previousStatus,
            String nextStatus
    ) {
        if (previousStatus != null && previousStatus.equals(nextStatus)) {
            return;
        }

        createEvent(
                lead,
                client,
                actorUser,
                actorRole,
                "status_changed",
                previousStatus,
                nextStatus,
                "Status changed from " + previousStatus + " to " + nextStatus
        );
    }

    private void createEvent(
            ClientCrmLeadEntity lead,
            ClientEntity client,
            AppUserEntity actorUser,
            String actorRole,
            String eventType,
            String fromStatus,
            String toStatus,
            String summary
    ) {
        ClientCrmLeadEventEntity event = new ClientCrmLeadEventEntity();
        event.setLead(lead);
        event.setClient(client);
        event.setActorUser(actorUser);
        event.setActorRole(actorRole == null || actorRole.isBlank() ? "system" : actorRole);
        event.setEventType(eventType);
        event.setFromStatus(fromStatus);
        event.setToStatus(toStatus);
        event.setSummary(trimToLimit(summary, 1200));
        clientCrmLeadEventRepository.save(event);
    }

    private ClientCrmLeadResponse mapLeadForClient(ClientCrmLeadEntity lead) {
        List<ClientCrmFollowUpActionResponse> followUpActions = clientCrmFollowUpActionRepository.findAllByLeadOrderByCreatedAtAscIdAsc(lead)
                .stream()
                .filter(this::isClientVisibleFollowUpAction)
                .map(this::mapFollowUpActionForClient)
                .toList();
        List<ClientCrmLeadNoteResponse> notes = clientCrmLeadNoteRepository.findAllByLeadOrderByCreatedAtAsc(lead)
                .stream()
                .filter(this::isClientVisibleNote)
                .map(this::mapNoteForClient)
                .toList();
        List<ClientCrmLeadEventResponse> events = clientCrmLeadEventRepository.findAllByLeadOrderByCreatedAtAscIdAsc(lead)
                .stream()
                .filter(this::isClientVisibleEvent)
                .map(this::mapEventForClient)
                .toList();

        return mapLead(lead, followUpActions, notes, events);
    }

    private ClientCrmLeadResponse mapLeadForAdmin(ClientCrmLeadEntity lead) {
        List<ClientCrmFollowUpActionResponse> followUpActions = clientCrmFollowUpActionRepository.findAllByLeadOrderByCreatedAtAscIdAsc(lead)
                .stream()
                .map(this::mapFollowUpActionForAdmin)
                .toList();
        List<ClientCrmLeadNoteResponse> notes = clientCrmLeadNoteRepository.findAllByLeadOrderByCreatedAtAsc(lead)
                .stream()
                .map(this::mapNoteForAdmin)
                .toList();
        List<ClientCrmLeadEventResponse> events = clientCrmLeadEventRepository.findAllByLeadOrderByCreatedAtAscIdAsc(lead)
                .stream()
                .map(this::mapEventForAdmin)
                .toList();

        return mapLead(lead, followUpActions, notes, events);
    }

    private ClientCrmLeadResponse mapLead(
            ClientCrmLeadEntity lead,
            List<ClientCrmFollowUpActionResponse> followUpActions,
            List<ClientCrmLeadNoteResponse> notes,
            List<ClientCrmLeadEventResponse> events
    ) {
        return new ClientCrmLeadResponse(
                lead.getId(),
                lead.getClient().getId(),
                lead.getFullName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getSource(),
                lead.getStatus(),
                lead.getPriority(),
                lead.getSectorType(),
                readSectorFields(lead.getSectorFieldsJson()),
                followUpActions,
                notes,
                events,
                lead.getCreatedAt(),
                lead.getUpdatedAt()
        );
    }

    private ClientCrmFollowUpActionResponse mapFollowUpActionForClient(ClientCrmFollowUpActionEntity action) {
        return mapFollowUpAction(action, null);
    }

    private ClientCrmFollowUpActionResponse mapFollowUpActionForAdmin(ClientCrmFollowUpActionEntity action) {
        return mapFollowUpAction(
                action,
                action.getCreatedByUser() == null ? null : action.getCreatedByUser().getUsername()
        );
    }

    private ClientCrmFollowUpActionResponse mapFollowUpAction(
            ClientCrmFollowUpActionEntity action,
            String createdByUsername
    ) {
        return new ClientCrmFollowUpActionResponse(
                action.getId(),
                action.getLead().getId(),
                action.getClient().getId(),
                action.getTitle(),
                action.getDescription(),
                action.getStatus(),
                normalizeActorRole(action.getOwnerRole()),
                createdByUsername,
                action.isVisibleToClient(),
                action.getDueAt(),
                action.getCompletedAt(),
                action.getCreatedAt(),
                action.getUpdatedAt()
        );
    }

    private ClientCrmLeadNoteResponse mapNoteForClient(ClientCrmLeadNoteEntity note) {
        return new ClientCrmLeadNoteResponse(
                note.getId(),
                note.getLead().getId(),
                note.getContent(),
                null,
                normalizeActorRole(note.getAuthorRole()),
                note.isVisibleToClient(),
                note.getCreatedAt()
        );
    }

    private ClientCrmLeadNoteResponse mapNoteForAdmin(ClientCrmLeadNoteEntity note) {
        return new ClientCrmLeadNoteResponse(
                note.getId(),
                note.getLead().getId(),
                note.getContent(),
                note.getAuthorUser() == null ? null : note.getAuthorUser().getUsername(),
                normalizeActorRole(note.getAuthorRole()),
                note.isVisibleToClient(),
                note.getCreatedAt()
        );
    }

    private ClientCrmLeadEventResponse mapEventForClient(ClientCrmLeadEventEntity event) {
        return new ClientCrmLeadEventResponse(
                event.getId(),
                event.getLead().getId(),
                event.getEventType(),
                normalizeActorRole(event.getActorRole()),
                null,
                event.getFromStatus(),
                event.getToStatus(),
                clientVisibleEventSummary(event),
                event.getCreatedAt()
        );
    }

    private ClientCrmLeadEventResponse mapEventForAdmin(ClientCrmLeadEventEntity event) {
        return new ClientCrmLeadEventResponse(
                event.getId(),
                event.getLead().getId(),
                event.getEventType(),
                event.getActorRole(),
                event.getActorUser() == null ? null : event.getActorUser().getUsername(),
                event.getFromStatus(),
                event.getToStatus(),
                event.getSummary(),
                event.getCreatedAt()
        );
    }

    private boolean isClientVisibleNote(ClientCrmLeadNoteEntity note) {
        String role = normalizeActorRole(note.getAuthorRole());
        return "client".equals(role) || "system".equals(role) || note.isVisibleToClient();
    }

    private boolean isClientVisibleFollowUpAction(ClientCrmFollowUpActionEntity action) {
        String role = normalizeActorRole(action.getOwnerRole());
        return "client".equals(role) || "system".equals(role) || action.isVisibleToClient();
    }

    private boolean isClientVisibleEvent(ClientCrmLeadEventEntity event) {
        String role = normalizeActorRole(event.getActorRole());
        return "client".equals(role) || "system".equals(role);
    }

    private String clientVisibleEventSummary(ClientCrmLeadEventEntity event) {
        return switch (event.getEventType()) {
            case "lead_created" -> "Lead added to your workspace";
            case "status_changed" -> "Status changed from " + event.getFromStatus() + " to " + event.getToStatus();
            case "note_added" -> "Workspace note added";
            case "follow_up_created" -> "Follow-up action added";
            case "follow_up_status_changed" -> "Follow-up action status changed";
            default -> "Workspace activity updated";
        };
    }

    private String normalizeActorRole(String role) {
        if (role == null || role.isBlank()) {
            return "system";
        }

        String normalized = role.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "client", "admin", "system" -> normalized;
            default -> "system";
        };
    }

    private String normalizeFollowUpStatus(String status) {
        if (status == null || status.isBlank()) {
            return "open";
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "open", "done", "cancelled" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported follow-up action status");
        };
    }

    private Map<String, String> sanitizeSectorFields(Map<String, String> fields) {
        Map<String, String> sanitized = new LinkedHashMap<>();

        if (fields == null) {
            return sanitized;
        }

        fields.forEach((key, value) -> {
            String normalizedKey = normalizeFieldKey(key);
            String normalizedValue = trimToLimit(value, 240);

            if (!normalizedKey.isBlank() && !normalizedValue.isBlank() && sanitized.size() < 12) {
                sanitized.put(normalizedKey, normalizedValue);
            }
        });

        return sanitized;
    }

    private String writeSectorFields(Map<String, String> fields) {
        try {
            return objectMapper.writeValueAsString(fields);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid sector fields");
        }
    }

    private Map<String, String> readSectorFields(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(json, SECTOR_FIELDS_TYPE);
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private String normalizeFieldKey(String key) {
        if (key == null) {
            return "";
        }

        return key.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_]+", "_").replaceAll("^_+|_+$", "");
    }

    private String trimRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimOptional(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.trim();
    }

    private String trimOptionalLowercase(String value) {
        String trimmed = trimOptional(value);
        return trimmed.isBlank() ? "" : trimmed.toLowerCase(Locale.ROOT);
    }

    private String trimToLimit(String value, int maxLength) {
        if (value == null) {
            return "";
        }

        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
