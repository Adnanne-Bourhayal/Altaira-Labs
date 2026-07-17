package com.altaira.backend.service;

import com.altaira.backend.dto.clientportal.ClientPortalModuleResponse;
import com.altaira.backend.dto.clientportal.ClientPortalResponse;
import com.altaira.backend.dto.clientportal.ClientProjectAssetResponse;
import com.altaira.backend.dto.clientportal.ClientProjectConfigSnapshotResponse;
import com.altaira.backend.dto.clientportal.ClientProjectResponse;
import com.altaira.backend.dto.clientportal.CreateClientProjectConfigSnapshotRequest;
import com.altaira.backend.dto.clientportal.CreateProjectLinkRequest;
import com.altaira.backend.dto.clientportal.ReviewProjectAssetRequest;
import com.altaira.backend.dto.clientportal.SubmitProjectFeedbackRequest;
import com.altaira.backend.dto.clientportal.UpdateClientProjectRequest;
import com.altaira.backend.dto.onboarding.OnboardingDashboardResponse;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientProjectAssetEntity;
import com.altaira.backend.entity.ClientProjectConfigSnapshotEntity;
import com.altaira.backend.entity.ClientProjectEntity;
import com.altaira.backend.entity.ClientServiceEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.ClientServiceStatus;
import com.altaira.backend.model.ProjectPhase;
import com.altaira.backend.repository.ClientProjectAssetRepository;
import com.altaira.backend.repository.ClientProjectConfigSnapshotRepository;
import com.altaira.backend.repository.ClientProjectRepository;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.security.ClientAccessContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientPortalService {

    private static final String EXTERNAL_LINK_STORAGE_PREFIX = "external-link:";

    private static final List<ModuleDefinition> MODULES = List.of(
            new ModuleDefinition("web_seo", "Web & SEO", "Project status, content handoff, staging and launch readiness."),
            new ModuleDefinition("crm", "CRM / Lead Management", "Lead pipeline, follow-up records and sector-specific client fields."),
            new ModuleDefinition("booking", "Booking System", "Appointments, reservations, resources and daily agenda operations."),
            new ModuleDefinition("automation", "Workflow Automation", "Reusable trigger/action recipes for repetitive follow-up work."),
            new ModuleDefinition("dashboard", "Management Dashboard", "Business KPIs and operational analytics for decisions.")
    );

    private final OnboardingService onboardingService;
    private final OnboardingTemplateService onboardingTemplateService;
    private final ClientManagementService clientManagementService;
    private final ClientServiceRepository clientServiceRepository;
    private final ClientProjectRepository clientProjectRepository;
    private final ClientProjectAssetRepository clientProjectAssetRepository;
    private final ClientProjectConfigSnapshotRepository clientProjectConfigSnapshotRepository;
    private final OnboardingFileStorageService onboardingFileStorageService;
    private final ObjectMapper objectMapper;

    public ClientPortalService(
            OnboardingService onboardingService,
            OnboardingTemplateService onboardingTemplateService,
            ClientManagementService clientManagementService,
            ClientServiceRepository clientServiceRepository,
            ClientProjectRepository clientProjectRepository,
            ClientProjectAssetRepository clientProjectAssetRepository,
            ClientProjectConfigSnapshotRepository clientProjectConfigSnapshotRepository,
            OnboardingFileStorageService onboardingFileStorageService,
            ObjectMapper objectMapper
    ) {
        this.onboardingService = onboardingService;
        this.onboardingTemplateService = onboardingTemplateService;
        this.clientManagementService = clientManagementService;
        this.clientServiceRepository = clientServiceRepository;
        this.clientProjectRepository = clientProjectRepository;
        this.clientProjectAssetRepository = clientProjectAssetRepository;
        this.clientProjectConfigSnapshotRepository = clientProjectConfigSnapshotRepository;
        this.onboardingFileStorageService = onboardingFileStorageService;
        this.objectMapper = objectMapper;
    }

    public ClientPortalResponse getPortal(ClientAccessContext context) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client dashboard is locked until the service contract is approved"
            );
        }

        return buildPortal(context.client(), onboarding);
    }

    public ClientPortalResponse getPortalForAdmin(UUID clientId) {
        OnboardingDashboardResponse onboarding = onboardingService.getAdminDashboard(clientId);
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        return buildPortal(client, onboarding);
    }

    public ClientProjectResponse updateProjectAsAdmin(UUID projectId, UpdateClientProjectRequest request) {
        ClientProjectEntity project = findProject(projectId);

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(trimToNull(request.getName()));
        }

        if (request.getCurrentPhase() != null && !request.getCurrentPhase().isBlank()) {
            ProjectPhase phase = ProjectPhase.parse(request.getCurrentPhase());
            project.setCurrentPhase(phase.value());

            if (phase != ProjectPhase.REVIEW) {
                project.setRevisionPendingAt(null);
            }
        }

        if (request.getStagingUrl() != null) {
            String stagingUrl = trimToNull(request.getStagingUrl());
            project.setStagingUrl(stagingUrl == null ? null : normalizeExternalUrl(stagingUrl));
        }

        return mapProject(clientProjectRepository.save(project));
    }

    public List<ClientProjectAssetResponse> listProjectAssets(
            ClientAccessContext context,
            UUID projectId
    ) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client dashboard is locked until the service contract is approved"
            );
        }

        ClientProjectEntity project = findProject(projectId);
        ensureProjectBelongsToClient(project, context.client());

        return clientProjectAssetRepository.findAllByProjectOrderByUploadedAtAsc(project)
                .stream()
                .map(this::mapAsset)
                .toList();
    }

    public List<ClientProjectAssetResponse> uploadProjectAssets(
            ClientAccessContext context,
            UUID projectId,
            List<MultipartFile> files,
            String assetType,
            String notes
    ) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client dashboard is locked until the service contract is approved"
            );
        }

        ClientProjectEntity project = findProject(projectId);
        ensureProjectBelongsToClient(project, context.client());

        if (files == null || files.isEmpty() || files.stream().allMatch(MultipartFile::isEmpty)) {
            throw new IllegalArgumentException("At least one project asset file is required");
        }

        List<ClientProjectAssetResponse> uploadedAssets = new ArrayList<>();
        String normalizedAssetType = normalizeAssetType(assetType);
        String safeNotes = trimToLimit(notes, 2000);

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            var storedFile = onboardingFileStorageService.storeProjectAsset(context.client().getId(), project.getId(), file);

            ClientProjectAssetEntity asset = new ClientProjectAssetEntity();
            asset.setProject(project);
            asset.setClient(context.client());
            asset.setUploadedByUser(context.user());
            asset.setAssetType(normalizedAssetType);
            asset.setNotes(safeNotes);
            asset.setOriginalFilename(storedFile.originalFilename());
            asset.setStoredFilename(storedFile.storedFilename());
            asset.setStorageKey(storedFile.storageKey());
            asset.setContentType(storedFile.contentType());
            asset.setSizeBytes(storedFile.sizeBytes());
            asset.setChecksumSha256(storedFile.checksumSha256());
            asset.setStatus("uploaded");

            uploadedAssets.add(mapAsset(clientProjectAssetRepository.save(asset)));
        }

        return uploadedAssets;
    }

    public ClientProjectAssetResponse createProjectLink(
            ClientAccessContext context,
            UUID projectId,
            CreateProjectLinkRequest request
    ) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client dashboard is locked until the service contract is approved"
            );
        }

        ClientProjectEntity project = findProject(projectId);
        ensureProjectBelongsToClient(project, context.client());

        String safeUrl = normalizeExternalUrl(request.getUrl());
        String label = trimToLimit(request.getLabel(), 160);

        if (label == null || label.isBlank()) {
            label = URI.create(safeUrl).getHost();
        }

        ClientProjectAssetEntity asset = new ClientProjectAssetEntity();
        asset.setProject(project);
        asset.setClient(context.client());
        asset.setUploadedByUser(context.user());
        asset.setAssetType(normalizeAssetType(request.getAssetType() == null ? "external_link" : request.getAssetType()));
        asset.setNotes(trimToLimit(request.getNotes(), 2000));
        asset.setOriginalFilename(label);
        asset.setStoredFilename("external-link");
        asset.setStorageKey(EXTERNAL_LINK_STORAGE_PREFIX + UUID.randomUUID() + ":" + safeUrl);
        asset.setContentType("text/uri-list");
        asset.setSizeBytes(0);
        asset.setChecksumSha256(null);
        asset.setStatus("uploaded");

        return mapAsset(clientProjectAssetRepository.save(asset));
    }

    @Transactional(readOnly = true)
    public List<ClientProjectAssetResponse> listProjectAssetsAsAdmin(UUID projectId) {
        ClientProjectEntity project = findProject(projectId);
        return clientProjectAssetRepository.findAllByProjectOrderByUploadedAtAsc(project)
                .stream()
                .map(this::mapAsset)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClientProjectConfigSnapshotResponse> listProjectConfigSnapshotsAsAdmin(UUID projectId) {
        ClientProjectEntity project = findProject(projectId);
        return clientProjectConfigSnapshotRepository.findAllByProjectOrderByCreatedAtDesc(project)
                .stream()
                .map(this::mapConfigSnapshot)
                .toList();
    }

    public ClientProjectConfigSnapshotResponse createProjectConfigSnapshotAsAdmin(
            UUID projectId,
            CreateClientProjectConfigSnapshotRequest request,
            String createdByUsername
    ) {
        ClientProjectEntity project = findProject(projectId);
        var jsonNode = parseConfigSnapshotJson(request.getConfigJson());

        ClientProjectConfigSnapshotEntity snapshot = new ClientProjectConfigSnapshotEntity();
        snapshot.setProject(project);
        snapshot.setClient(project.getClient());
        snapshot.setServiceKey(normalizeAssetType(project.getProjectKey()));
        snapshot.setArtifactType(normalizeAssetType(request.getArtifactType()));
        snapshot.setLabel(trimToLimit(request.getLabel(), 180));
        snapshot.setConfigJson(jsonNode.toPrettyString());
        snapshot.setCreatedByUsername(trimToLimit(createdByUsername, 180));

        return mapConfigSnapshot(clientProjectConfigSnapshotRepository.save(snapshot));
    }

    @Transactional(readOnly = true)
    public ClientProjectAssetDownload getProjectAssetDownloadAsAdmin(UUID assetId) {
        ClientProjectAssetEntity asset = findAsset(assetId);

        if (isExternalLink(asset)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "External project links cannot be downloaded");
        }

        Path path = onboardingFileStorageService.resolve(asset.getStorageKey());

        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Stored project asset", assetId);
        }

        return new ClientProjectAssetDownload(asset, path);
    }

    public ClientProjectAssetResponse approveProjectAssetAsAdmin(UUID assetId) {
        ClientProjectAssetEntity asset = findAsset(assetId);
        asset.setStatus("approved");
        asset.setAdminFeedback(null);
        asset.setReviewedAt(Instant.now());
        return mapAsset(clientProjectAssetRepository.save(asset));
    }

    public ClientProjectAssetResponse rejectProjectAssetAsAdmin(UUID assetId, ReviewProjectAssetRequest request) {
        ClientProjectAssetEntity asset = findAsset(assetId);
        asset.setStatus("rejected");
        asset.setAdminFeedback(trimToLimit(request == null ? null : request.getFeedback(), 1000));
        asset.setReviewedAt(Instant.now());
        return mapAsset(clientProjectAssetRepository.save(asset));
    }

    public ClientProjectResponse submitProjectFeedback(
            ClientAccessContext context,
            UUID projectId,
            SubmitProjectFeedbackRequest request
    ) {
        OnboardingDashboardResponse onboarding = onboardingService.getClientDashboard(context);

        if (!onboarding.isContractApproved()) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Client dashboard is locked until the service contract is approved"
            );
        }

        ClientProjectEntity project = findProject(projectId);

        if (!project.getClient().getId().equals(context.client().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this client project");
        }

        project.setLatestClientFeedback(trimToLimit(request.getFeedback(), 2000));
        project.setRevisionPendingAt(Instant.now());
        project.setCurrentPhase(ProjectPhase.REVIEW.value());

        return mapProject(clientProjectRepository.save(project));
    }

    private ClientPortalResponse buildPortal(ClientEntity client, OnboardingDashboardResponse onboarding) {
        List<ClientServiceEntity> activeAssignments = clientServiceRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .filter(this::isVisibleClientService)
                .toList();

        Map<String, ClientServiceEntity> assignmentByModule = activeAssignments.stream()
                .collect(Collectors.toMap(
                        onboardingTemplateService::serviceKey,
                        Function.identity(),
                        this::preferMostRelevantAssignment
                ));

        ensureModuleProjects(client, assignmentByModule);

        List<ClientPortalModuleResponse> modules = MODULES.stream()
                .map(module -> mapModule(module, assignmentByModule.get(module.moduleKey())))
                .toList();

        List<ClientProjectResponse> projects = clientProjectRepository.findAllByClientOrderByCreatedAtAsc(client)
                .stream()
                .sorted(Comparator.comparing(ClientProjectEntity::getCreatedAt))
                .map(this::mapProject)
                .toList();

        return new ClientPortalResponse(
                clientManagementService.map(client),
                onboarding.isOnboardingCompleted(),
                onboarding.isContractApproved(),
                modules,
                projects,
                onboarding.getAccessRole(),
                onboarding.isCanEdit()
        );
    }

    private boolean isVisibleClientService(ClientServiceEntity assignment) {
        return assignment.getStatus() != null &&
                !ClientServiceStatus.CANCELLED.value().equals(assignment.getStatus());
    }

    private ClientServiceEntity preferMostRelevantAssignment(ClientServiceEntity current, ClientServiceEntity candidate) {
        if (ClientServiceStatus.IN_PROGRESS.value().equals(candidate.getStatus())) {
            return candidate;
        }

        if (ClientServiceStatus.IN_PROGRESS.value().equals(current.getStatus())) {
            return current;
        }

        return current.getCreatedAt().isAfter(candidate.getCreatedAt()) ? current : candidate;
    }

    private void ensureModuleProjects(ClientEntity client, Map<String, ClientServiceEntity> assignmentByModule) {
        MODULES.forEach(module -> {
            ClientServiceEntity assignment = assignmentByModule.get(module.moduleKey());
            if (assignment == null) {
                return;
            }

            Optional<ClientProjectEntity> existingProject = clientProjectRepository.findByClientAndClientServiceAndProjectKey(
                    client,
                    assignment,
                    module.moduleKey()
            );

            if (existingProject.isPresent()) {
                return;
            }

            ClientProjectEntity project = new ClientProjectEntity();
            project.setClient(client);
            project.setClientService(assignment);
            project.setProjectKey(module.moduleKey());
            project.setName(module.title() + " project");
            project.setCurrentPhase(ProjectPhase.REQUIREMENTS.value());
            clientProjectRepository.save(project);
        });
    }

    private ClientPortalModuleResponse mapModule(ModuleDefinition module, ClientServiceEntity assignment) {
        boolean active = assignment != null;

        return new ClientPortalModuleResponse(
                module.moduleKey(),
                module.title(),
                module.description(),
                active,
                !active,
                active ? assignment.getStatus() : "locked",
                active ? assignment.getId() : null,
                active ? assignment.getService().getName() : null
        );
    }

    private ClientProjectResponse mapProject(ClientProjectEntity project) {
        return new ClientProjectResponse(
                project.getId(),
                project.getClientService() == null ? null : project.getClientService().getId(),
                project.getProjectKey(),
                project.getName(),
                project.getCurrentPhase(),
                project.getStagingUrl(),
                project.getLatestClientFeedback(),
                project.getRevisionPendingAt(),
                clientProjectAssetRepository.findAllByProjectOrderByUploadedAtAsc(project)
                        .stream()
                        .map(this::mapAsset)
                        .toList(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private ClientProjectEntity findProject(UUID projectId) {
        return clientProjectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Client project", projectId));
    }

    private ClientProjectAssetEntity findAsset(UUID assetId) {
        return clientProjectAssetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Client project asset", assetId));
    }

    private void ensureProjectBelongsToClient(ClientProjectEntity project, ClientEntity client) {
        if (!project.getClient().getId().equals(client.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this client project");
        }
    }

    private String normalizeAssetType(String assetType) {
        String normalized = trimToLimit(assetType, 80);

        if (normalized == null || normalized.isBlank()) {
            return "general";
        }

        return normalized.toLowerCase().replaceAll("[^a-z0-9_-]", "_");
    }

    private ClientProjectAssetResponse mapAsset(ClientProjectAssetEntity asset) {
        return new ClientProjectAssetResponse(
                asset.getId(),
                asset.getProject().getId(),
                asset.getClient().getId(),
                asset.getAssetType(),
                asset.getNotes(),
                asset.getOriginalFilename(),
                asset.getContentType(),
                asset.getSizeBytes(),
                asset.getChecksumSha256(),
                externalUrl(asset),
                asset.getStatus(),
                asset.getAdminFeedback(),
                asset.getUploadedAt(),
                asset.getReviewedAt()
        );
    }

    private ClientProjectConfigSnapshotResponse mapConfigSnapshot(ClientProjectConfigSnapshotEntity snapshot) {
        return new ClientProjectConfigSnapshotResponse(
                snapshot.getId(),
                snapshot.getProject().getId(),
                snapshot.getClient().getId(),
                snapshot.getServiceKey(),
                snapshot.getArtifactType(),
                snapshot.getLabel(),
                snapshot.getConfigJson(),
                snapshot.getCreatedByUsername(),
                snapshot.getCreatedAt()
        );
    }

    private com.fasterxml.jackson.databind.JsonNode parseConfigSnapshotJson(String configJson) {
        try {
            var jsonNode = objectMapper.readTree(configJson);

            if (jsonNode == null || !jsonNode.isObject()) {
                throw new IllegalArgumentException("Configuration snapshot must be a JSON object");
            }

            return jsonNode;
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Configuration snapshot must be valid JSON");
        }
    }

    private String normalizeExternalUrl(String value) {
        String safeUrl = trimToLimit(value, 500);

        try {
            URI uri = URI.create(safeUrl);
            String scheme = uri.getScheme();

            if (scheme == null || uri.getHost() == null ||
                    (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException("Project link must be a valid http or https URL");
            }

            return uri.toString();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Project link must be a valid http or https URL");
        }
    }

    private boolean isExternalLink(ClientProjectAssetEntity asset) {
        return asset.getStorageKey() != null && asset.getStorageKey().startsWith(EXTERNAL_LINK_STORAGE_PREFIX);
    }

    private String externalUrl(ClientProjectAssetEntity asset) {
        if (!isExternalLink(asset)) {
            return null;
        }

        String value = asset.getStorageKey().substring(EXTERNAL_LINK_STORAGE_PREFIX.length());
        int separatorIndex = value.indexOf(':');
        return separatorIndex >= 0 ? value.substring(separatorIndex + 1) : value;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String trimToLimit(String value, int maxLength) {
        if (value == null) {
            return "";
        }

        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    public record ClientProjectAssetDownload(ClientProjectAssetEntity asset, Path path) {}

    private record ModuleDefinition(String moduleKey, String title, String description) {}
}
