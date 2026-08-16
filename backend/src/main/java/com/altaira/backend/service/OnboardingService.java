package com.altaira.backend.service;

import com.altaira.backend.dto.client.ClientResponse;
import com.altaira.backend.dto.onboarding.OnboardingDashboardResponse;
import com.altaira.backend.dto.onboarding.OnboardingFileResponse;
import com.altaira.backend.dto.onboarding.OnboardingTaskResponse;
import com.altaira.backend.dto.onboarding.SubmitOnboardingTaskRequest;
import com.altaira.backend.dto.media.CompletePrivateUploadRequest;
import com.altaira.backend.dto.media.PreparePrivateUploadRequest;
import com.altaira.backend.dto.media.UploadUrlResponse;
import com.altaira.backend.entity.*;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.OnboardingTaskStatus;
import com.altaira.backend.model.OnboardingTaskType;
import com.altaira.backend.model.SectorType;
import com.altaira.backend.repository.ClientServiceRepository;
import com.altaira.backend.repository.ClientWorkspaceRepository;
import com.altaira.backend.repository.OnboardingAuditLogRepository;
import com.altaira.backend.repository.OnboardingFileRepository;
import com.altaira.backend.repository.OnboardingTaskRepository;
import com.altaira.backend.security.ClientAccessContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class OnboardingService {

    private final ClientManagementService clientManagementService;
    private final ClientServiceRepository clientServiceRepository;
    private final ClientWorkspaceRepository clientWorkspaceRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;
    private final OnboardingFileRepository onboardingFileRepository;
    private final OnboardingAuditLogRepository onboardingAuditLogRepository;
    private final OnboardingTemplateService onboardingTemplateService;
    private final OnboardingFileStorageService onboardingFileStorageService;
    private final MediaUploadUrlService mediaUploadUrlService;
    private final SignedContractPdfService signedContractPdfService;
    private final OnboardingNotificationService onboardingNotificationService;
    private final ObjectMapper objectMapper;

    public OnboardingService(
            ClientManagementService clientManagementService,
            ClientServiceRepository clientServiceRepository,
            ClientWorkspaceRepository clientWorkspaceRepository,
            OnboardingTaskRepository onboardingTaskRepository,
            OnboardingFileRepository onboardingFileRepository,
            OnboardingAuditLogRepository onboardingAuditLogRepository,
            OnboardingTemplateService onboardingTemplateService,
            OnboardingFileStorageService onboardingFileStorageService,
            MediaUploadUrlService mediaUploadUrlService,
            SignedContractPdfService signedContractPdfService,
            OnboardingNotificationService onboardingNotificationService,
            ObjectMapper objectMapper
    ) {
        this.clientManagementService = clientManagementService;
        this.clientServiceRepository = clientServiceRepository;
        this.clientWorkspaceRepository = clientWorkspaceRepository;
        this.onboardingTaskRepository = onboardingTaskRepository;
        this.onboardingFileRepository = onboardingFileRepository;
        this.onboardingAuditLogRepository = onboardingAuditLogRepository;
        this.onboardingTemplateService = onboardingTemplateService;
        this.onboardingFileStorageService = onboardingFileStorageService;
        this.mediaUploadUrlService = mediaUploadUrlService;
        this.signedContractPdfService = signedContractPdfService;
        this.onboardingNotificationService = onboardingNotificationService;
        this.objectMapper = objectMapper;
    }

    public OnboardingDashboardResponse getAdminDashboard(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        ClientWorkspaceEntity workspace = ensureWorkspaceAndTasks(client);
        OnboardingDashboardResponse dashboard = mapDashboard(workspace);
        dashboard.setAccessRole("admin");
        dashboard.setCanEdit(true);
        return dashboard;
    }

    public OnboardingDashboardResponse getClientDashboard(ClientAccessContext context) {
        ClientWorkspaceEntity workspace = ensureWorkspaceAndTasks(context.client());
        OnboardingDashboardResponse dashboard = mapDashboard(workspace);
        dashboard.setAccessRole(context.accessRole());
        dashboard.setCanEdit(
                "client_user".equalsIgnoreCase(context.user().getRole()) &&
                        "client_user".equalsIgnoreCase(context.accessRole())
        );
        return dashboard;
    }

    public OnboardingDashboardResponse regenerateAdminDashboard(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        ClientWorkspaceEntity workspace = ensureWorkspaceAndTasks(client);
        OnboardingDashboardResponse dashboard = mapDashboard(workspace);
        dashboard.setAccessRole("admin");
        dashboard.setCanEdit(true);
        return dashboard;
    }

    public OnboardingTaskResponse submitClientTask(
            ClientAccessContext context,
            UUID taskId,
            SubmitOnboardingTaskRequest request,
            String ipAddress,
            String userAgent
    ) {
        OnboardingTaskEntity task = findTask(taskId);
        ensureTaskBelongsToClient(task, context.client());

        OnboardingTaskType taskType = OnboardingTaskType.parse(task.getTaskType());
        Instant now = Instant.now();

        if (taskType == OnboardingTaskType.SIGNATURE) {
            applySignatureSubmission(task, request, ipAddress, userAgent, now);
        } else if (taskType == OnboardingTaskType.FILE_UPLOAD) {
            applyFileSubmission(task, request);
        } else if (taskType == OnboardingTaskType.PREFERENCES_FORM) {
            applyPreferencesSubmission(task, request);
        }

        task.setStatus(OnboardingTaskStatus.SUBMITTED.value());
        task.setSubmittedAt(now);
        task.setRejectedAt(null);
        task.setAdminFeedback(null);
        task.setCompletedAt(null);

        OnboardingTaskEntity saved = onboardingTaskRepository.save(task);
        recordAudit(saved, context.user(), context.accessRole(), "client_task_submitted", ipAddress, userAgent, "{}");

        if (taskType == OnboardingTaskType.SIGNATURE) {
            byte[] signedPdf = signedContractPdfService.buildSignedContractEvidence(saved.getClient(), saved);
            onboardingNotificationService.sendContractSubmitted(saved.getClient(), saved, signedPdf);
        }

        refreshWorkspaceStatus(saved.getWorkspace());
        return mapTask(saved);
    }

    public OnboardingTaskResponse submitClientFiles(
            ClientAccessContext context,
            UUID taskId,
            List<MultipartFile> files,
            String notes,
            String ipAddress,
            String userAgent
    ) {
        OnboardingTaskEntity task = findTask(taskId);
        ensureTaskBelongsToClient(task, context.client());

        if (OnboardingTaskType.parse(task.getTaskType()) != OnboardingTaskType.FILE_UPLOAD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This onboarding task does not accept files");
        }

        if (files == null || files.isEmpty() || files.stream().allMatch(MultipartFile::isEmpty)) {
            throw new IllegalArgumentException("At least one file is required");
        }

        List<OnboardingFileResponse> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            var storedFile = onboardingFileStorageService.store(context.client().getId(), task.getId(), file);

            OnboardingFileEntity fileEntity = new OnboardingFileEntity();
            fileEntity.setTask(task);
            fileEntity.setWorkspace(task.getWorkspace());
            fileEntity.setClient(task.getClient());
            fileEntity.setOriginalFilename(storedFile.originalFilename());
            fileEntity.setStoredFilename(storedFile.storedFilename());
            fileEntity.setStorageKey(storedFile.storageKey());
            fileEntity.setContentType(storedFile.contentType());
            fileEntity.setSizeBytes(storedFile.sizeBytes());
            fileEntity.setChecksumSha256(storedFile.checksumSha256());

            uploadedFiles.add(mapFile(onboardingFileRepository.save(fileEntity)));
        }

        Instant now = Instant.now();
        List<OnboardingFileResponse> allTaskFiles = onboardingFileRepository.findAllByTaskOrderByCreatedAtAsc(task)
                .stream()
                .map(this::mapFile)
                .toList();

        String safeNotes = trimToLimit(notes, 2000);
        task.setFileMetadataJson(toJson(allTaskFiles));
        task.setDataJson(toJson(Map.of("notes", safeNotes == null ? "" : safeNotes)));
        task.setStatus(OnboardingTaskStatus.SUBMITTED.value());
        task.setSubmittedAt(now);
        task.setRejectedAt(null);
        task.setAdminFeedback(null);
        task.setCompletedAt(null);

        OnboardingTaskEntity saved = onboardingTaskRepository.save(task);
        recordAudit(
                saved,
                context.user(),
                context.accessRole(),
                "client_files_uploaded",
                ipAddress,
                userAgent,
                toJson(Map.of("uploadedFileCount", uploadedFiles.size()))
        );
        refreshWorkspaceStatus(saved.getWorkspace());
        return mapTask(saved);
    }

    public UploadUrlResponse prepareClientTaskUpload(
            ClientAccessContext context,
            UUID taskId,
            PreparePrivateUploadRequest request
    ) {
        OnboardingTaskEntity task = findTask(taskId);
        ensureTaskBelongsToClient(task, context.client());
        ensureFileUploadTask(task);

        return mediaUploadUrlService.createContextUploadUrl(
                context.client().getId(),
                storageFolderForTask(task),
                task.getServiceKey(),
                "onboarding",
                task.getId(),
                request
        );
    }

    public OnboardingTaskResponse completeClientTaskUpload(
            ClientAccessContext context,
            UUID taskId,
            CompletePrivateUploadRequest request,
            String ipAddress,
            String userAgent
    ) {
        OnboardingTaskEntity task = findTask(taskId);
        ensureTaskBelongsToClient(task, context.client());
        ensureFileUploadTask(task);

        var verified = mediaUploadUrlService.verifyCompletedUpload(
                context.client().getId(),
                storageFolderForTask(task),
                task.getServiceKey(),
                "onboarding",
                task.getId(),
                request.getBucket(),
                request.getObjectKey(),
                request.getFilename(),
                request.getContentType(),
                request.getSizeBytes()
        );

        var existing = onboardingFileRepository.findByStorageKey(verified.storageKey());
        if (existing.isPresent()) {
            OnboardingFileEntity existingFile = existing.get();
            if (!existingFile.getClient().getId().equals(context.client().getId()) ||
                    !existingFile.getTask().getId().equals(task.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Uploaded object is already assigned to another context");
            }
            return mapTask(task);
        }

        OnboardingFileEntity fileEntity = new OnboardingFileEntity();
        fileEntity.setTask(task);
        fileEntity.setWorkspace(task.getWorkspace());
        fileEntity.setClient(task.getClient());
        fileEntity.setOriginalFilename(verified.originalFilename());
        fileEntity.setStoredFilename(verified.storedFilename());
        fileEntity.setStorageKey(verified.storageKey());
        fileEntity.setContentType(verified.contentType());
        fileEntity.setSizeBytes(verified.sizeBytes());
        fileEntity.setChecksumSha256(verified.checksumSha256());

        try {
            onboardingFileRepository.save(fileEntity);
            markFileTaskSubmitted(task, request.getNotes(), ipAddress, userAgent, context);
            return mapTask(task);
        } catch (RuntimeException ex) {
            mediaUploadUrlService.deleteStoredObjectQuietly(verified.storageKey());
            throw ex;
        }
    }

    public OnboardingTaskResponse approveTask(UUID taskId, AppUserEntity adminUser, String ipAddress, String userAgent) {
        OnboardingTaskEntity task = findTask(taskId);
        Instant now = Instant.now();

        task.setStatus(OnboardingTaskStatus.APPROVED.value());
        task.setApprovedAt(now);
        task.setRejectedAt(null);
        task.setCompletedAt(now);
        task.setAdminFeedback(null);

        if (OnboardingTaskType.SIGNATURE.value().equals(task.getTaskType())) {
            task.getWorkspace().setContractApprovedAt(now);
        }

        OnboardingTaskEntity saved = onboardingTaskRepository.save(task);
        recordAudit(saved, adminUser, adminUser == null ? "admin" : adminUser.getRole(), "admin_task_approved", ipAddress, userAgent, "{}");
        refreshWorkspaceStatus(saved.getWorkspace());
        return mapTask(saved);
    }

    @Transactional(readOnly = true)
    public List<OnboardingFileResponse> listTaskFilesAsAdmin(UUID taskId) {
        OnboardingTaskEntity task = findTask(taskId);
        return onboardingFileRepository.findAllByTaskOrderByCreatedAtAsc(task)
                .stream()
                .map(this::mapFile)
                .toList();
    }

    @Transactional(readOnly = true)
    public OnboardingFileDownload getFileDownloadAsAdmin(UUID fileId) {
        OnboardingFileEntity file = onboardingFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding file", fileId));
        try {
            return new OnboardingFileDownload(file, onboardingFileStorageService.open(file.getStorageKey()));
        } catch (IOException ex) {
            throw new ResourceNotFoundException("Stored onboarding file", fileId);
        }
    }

    @Transactional(readOnly = true)
    public OnboardingFileDownload getFileDownload(ClientAccessContext context, UUID fileId) {
        OnboardingFileEntity file = onboardingFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding file", fileId));

        if (!file.getClient().getId().equals(context.client().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this onboarding file");
        }

        try {
            return new OnboardingFileDownload(file, onboardingFileStorageService.open(file.getStorageKey()));
        } catch (IOException ex) {
            throw new ResourceNotFoundException("Stored onboarding file", fileId);
        }
    }

    private void ensureFileUploadTask(OnboardingTaskEntity task) {
        if (OnboardingTaskType.parse(task.getTaskType()) != OnboardingTaskType.FILE_UPLOAD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This onboarding task does not accept files");
        }
    }

    private String storageFolderForTask(OnboardingTaskEntity task) {
        String context = String.join(" ",
                task.getTaskKey() == null ? "" : task.getTaskKey(),
                task.getTitle() == null ? "" : task.getTitle(),
                task.getServiceKey() == null ? "" : task.getServiceKey()
        ).toLowerCase();

        if (context.matches(".*(contract|agreement|legal|privacy|nda|identity|migration).*")) {
            return "legal";
        }
        if (context.matches(".*(brand|logo|website|content|seo).*")) {
            return "branding";
        }
        return "multimedia";
    }

    private void markFileTaskSubmitted(
            OnboardingTaskEntity task,
            String notes,
            String ipAddress,
            String userAgent,
            ClientAccessContext context
    ) {
        List<OnboardingFileResponse> allTaskFiles = onboardingFileRepository.findAllByTaskOrderByCreatedAtAsc(task)
                .stream()
                .map(this::mapFile)
                .toList();
        Instant now = Instant.now();
        String safeNotes = trimToLimit(notes, 2000);

        task.setFileMetadataJson(toJson(allTaskFiles));
        task.setDataJson(toJson(Map.of("notes", safeNotes == null ? "" : safeNotes)));
        task.setStatus(OnboardingTaskStatus.SUBMITTED.value());
        task.setSubmittedAt(now);
        task.setRejectedAt(null);
        task.setAdminFeedback(null);
        task.setCompletedAt(null);

        OnboardingTaskEntity saved = onboardingTaskRepository.save(task);
        recordAudit(
                saved,
                context.user(),
                context.accessRole(),
                "client_s3_file_confirmed",
                ipAddress,
                userAgent,
                toJson(Map.of("fileCount", allTaskFiles.size()))
        );
        refreshWorkspaceStatus(saved.getWorkspace());
    }

    public OnboardingTaskResponse rejectTask(UUID taskId, String feedback, AppUserEntity adminUser, String ipAddress, String userAgent) {
        OnboardingTaskEntity task = findTask(taskId);
        Instant now = Instant.now();

        task.setStatus(OnboardingTaskStatus.REJECTED.value());
        task.setRejectedAt(now);
        task.setApprovedAt(null);
        task.setCompletedAt(null);
        task.setAdminFeedback(trimToLimit(feedback, 1000));

        OnboardingTaskEntity saved = onboardingTaskRepository.save(task);
        recordAudit(saved, adminUser, adminUser == null ? "admin" : adminUser.getRole(), "admin_task_rejected", ipAddress, userAgent, metadata("feedback", feedback));
        refreshWorkspaceStatus(saved.getWorkspace());
        return mapTask(saved);
    }

    ClientWorkspaceEntity ensureWorkspaceAndTasks(ClientEntity client) {
        ClientWorkspaceEntity workspace = clientWorkspaceRepository.findByClient(client)
                .orElseGet(() -> createWorkspace(client));

        SectorType sectorType = SectorType.parse(client.getSectorType());

        for (var template : onboardingTemplateService.generalTemplates(sectorType)) {
            ensureTask(workspace, client, null, template);
        }

        clientServiceRepository.findAllByClientOrderByCreatedAtDesc(client)
                .forEach(clientService -> onboardingTemplateService.serviceTemplates(clientService, sectorType)
                        .forEach(template -> ensureTask(workspace, client, clientService, template)));

        refreshWorkspaceStatus(workspace);
        return workspace;
    }

    private ClientWorkspaceEntity createWorkspace(ClientEntity client) {
        ClientWorkspaceEntity workspace = new ClientWorkspaceEntity();
        workspace.setClient(client);
        workspace.setName(client.getCompany() + " Workspace");
        workspace.setStatus("onboarding");
        return clientWorkspaceRepository.save(workspace);
    }

    private void ensureTask(
            ClientWorkspaceEntity workspace,
            ClientEntity client,
            ClientServiceEntity clientService,
            OnboardingTemplateService.TaskTemplate template
    ) {
        var existingTask = clientService == null
                ? onboardingTaskRepository.findByWorkspaceAndClientServiceIsNullAndTaskKey(workspace, template.taskKey())
                : onboardingTaskRepository.findByWorkspaceAndClientServiceAndTaskKey(workspace, clientService, template.taskKey());

        if (existingTask.isPresent()) {
            return;
        }

        OnboardingTaskEntity task = new OnboardingTaskEntity();
        task.setWorkspace(workspace);
        task.setClient(client);
        task.setClientService(clientService);
        task.setServiceKey(template.serviceKey());
        task.setSectorType(template.sectorType().value());
        task.setTaskKey(template.taskKey());
        task.setTitle(template.title());
        task.setDescription(template.description());
        task.setTaskType(template.taskType().value());
        task.setRequired(template.required());
        task.setCritical(template.critical());
        task.setSortOrder(template.sortOrder());
        task.setStatus(OnboardingTaskStatus.PENDING.value());
        onboardingTaskRepository.save(task);
    }

    private void applySignatureSubmission(
            OnboardingTaskEntity task,
            SubmitOnboardingTaskRequest request,
            String ipAddress,
            String userAgent,
            Instant now
    ) {
        if (request.getSignatureFullName() == null || request.getSignatureFullName().isBlank()) {
            throw new IllegalArgumentException("Signer full name is required");
        }

        if (request.getSignatureDocumentId() == null || request.getSignatureDocumentId().isBlank()) {
            throw new IllegalArgumentException("Document ID is required");
        }

        if (!request.isSignatureConsent()) {
            throw new IllegalArgumentException("Explicit legal consent is required");
        }

        task.setSignatureFullName(request.getSignatureFullName().trim());
        task.setSignatureDocumentId(request.getSignatureDocumentId().trim());
        task.setSignatureConsent(true);
        task.setSignedIp(trimToLimit(ipAddress, 80));
        task.setSignedUserAgent(trimToLimit(userAgent, 500));
        task.setSignedAt(now);
        task.setDataJson(toJson(Map.of(
                "signatureFullName", task.getSignatureFullName(),
                "signatureDocumentId", task.getSignatureDocumentId(),
                "signatureConsent", true,
                "signedAt", now.toString()
        )));
        task.getWorkspace().setContractSubmittedAt(now);
    }

    private void applyFileSubmission(OnboardingTaskEntity task, SubmitOnboardingTaskRequest request) {
        if (request.getFiles() == null || request.getFiles().isEmpty()) {
            throw new IllegalArgumentException("At least one file reference is required");
        }

        task.setFileMetadataJson(toJson(request.getFiles()));
        task.setDataJson(toJson(request.getData() == null ? Map.of() : request.getData()));
    }

    private void applyPreferencesSubmission(OnboardingTaskEntity task, SubmitOnboardingTaskRequest request) {
        if (request.getData() == null || request.getData().isEmpty()) {
            throw new IllegalArgumentException("Preference data is required");
        }

        task.setDataJson(toJson(request.getData()));
    }

    private void refreshWorkspaceStatus(ClientWorkspaceEntity workspace) {
        List<OnboardingTaskEntity> tasks = onboardingTaskRepository.findAllByWorkspaceOrderBySortOrderAscCreatedAtAsc(workspace);

        List<OnboardingTaskEntity> criticalSignatureTasks = tasks.stream()
                .filter(this::isCriticalSignatureTask)
                .toList();
        boolean contractSubmitted = !criticalSignatureTasks.isEmpty() && criticalSignatureTasks.stream().allMatch(this::isSubmittedOrApproved);
        boolean contractApproved = !criticalSignatureTasks.isEmpty() && criticalSignatureTasks.stream().allMatch(this::isApproved);
        boolean requiredComplete = tasks.stream()
                .filter(OnboardingTaskEntity::isRequired)
                .allMatch(task -> OnboardingTaskStatus.APPROVED.value().equals(task.getStatus()));

        if (contractSubmitted && workspace.getContractSubmittedAt() == null) {
            workspace.setContractSubmittedAt(Instant.now());
        }

        if (contractApproved && workspace.getContractApprovedAt() == null) {
            workspace.setContractApprovedAt(Instant.now());
        }

        boolean wasCompleted = workspace.isOnboardingCompleted();
        workspace.setOnboardingCompleted(requiredComplete && !tasks.isEmpty());
        workspace.setStatus(workspace.isOnboardingCompleted() ? "active" : "onboarding");
        clientWorkspaceRepository.save(workspace);

        if (!wasCompleted && workspace.isOnboardingCompleted()) {
            onboardingNotificationService.sendOnboardingReadyForReview(workspace.getClient());
        }
    }

    private OnboardingTaskEntity findTask(UUID taskId) {
        return onboardingTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding task", taskId));
    }

    private void ensureTaskBelongsToClient(OnboardingTaskEntity task, ClientEntity client) {
        if (!task.getClient().getId().equals(client.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this onboarding task");
        }
    }

    private void recordAudit(
            OnboardingTaskEntity task,
            AppUserEntity actor,
            String actorRole,
            String action,
            String ipAddress,
            String userAgent,
            String metadataJson
    ) {
        OnboardingAuditLogEntity auditLog = new OnboardingAuditLogEntity();
        auditLog.setTask(task);
        auditLog.setWorkspace(task.getWorkspace());
        auditLog.setClient(task.getClient());
        auditLog.setActorUser(actor);
        auditLog.setActorRole(actorRole == null || actorRole.isBlank() ? "unknown" : actorRole);
        auditLog.setAction(action);
        auditLog.setIpAddress(trimToLimit(ipAddress, 80));
        auditLog.setUserAgent(trimToLimit(userAgent, 500));
        auditLog.setMetadataJson(metadataJson == null || metadataJson.isBlank() ? "{}" : metadataJson);
        onboardingAuditLogRepository.save(auditLog);
    }

    private OnboardingDashboardResponse mapDashboard(ClientWorkspaceEntity workspace) {
        List<OnboardingTaskResponse> taskResponses = onboardingTaskRepository.findAllByWorkspaceOrderBySortOrderAscCreatedAtAsc(workspace)
                .stream()
                .map(this::mapTask)
                .toList();

        int totalRequired = (int) taskResponses.stream().filter(OnboardingTaskResponse::isRequired).count();
        int completedRequired = (int) taskResponses.stream()
                .filter(OnboardingTaskResponse::isRequired)
                .filter(task -> OnboardingTaskStatus.APPROVED.value().equals(task.getStatus()))
                .count();
        int submitted = (int) taskResponses.stream()
                .filter(task -> OnboardingTaskStatus.SUBMITTED.value().equals(task.getStatus()))
                .count();
        int rejected = (int) taskResponses.stream()
                .filter(task -> OnboardingTaskStatus.REJECTED.value().equals(task.getStatus()))
                .count();
        List<OnboardingTaskResponse> criticalSignatureTasks = taskResponses.stream()
                .filter(this::isCriticalSignatureTask)
                .toList();
        boolean contractSubmitted = !criticalSignatureTasks.isEmpty() && criticalSignatureTasks.stream().allMatch(this::isSubmittedOrApproved);
        boolean contractApproved = !criticalSignatureTasks.isEmpty() && criticalSignatureTasks.stream().allMatch(this::isApproved);

        return new OnboardingDashboardResponse(
                workspace.getId(),
                clientManagementService.map(workspace.getClient()),
                workspace.getName(),
                workspace.getStatus(),
                workspace.isOnboardingCompleted(),
                contractSubmitted,
                contractApproved,
                totalRequired,
                completedRequired,
                submitted,
                rejected,
                contractSubmitted ? workspace.getContractSubmittedAt() : null,
                contractApproved ? workspace.getContractApprovedAt() : null,
                taskResponses
        );
    }

    private boolean isCriticalSignatureTask(OnboardingTaskEntity task) {
        return task.isRequired() &&
                task.isCritical() &&
                OnboardingTaskType.SIGNATURE.value().equals(task.getTaskType());
    }

    private boolean isCriticalSignatureTask(OnboardingTaskResponse task) {
        return task.isRequired() &&
                task.isCritical() &&
                OnboardingTaskType.SIGNATURE.value().equals(task.getTaskType());
    }

    private boolean isSubmittedOrApproved(OnboardingTaskEntity task) {
        return OnboardingTaskStatus.SUBMITTED.value().equals(task.getStatus()) ||
                OnboardingTaskStatus.APPROVED.value().equals(task.getStatus());
    }

    private boolean isSubmittedOrApproved(OnboardingTaskResponse task) {
        return OnboardingTaskStatus.SUBMITTED.value().equals(task.getStatus()) ||
                OnboardingTaskStatus.APPROVED.value().equals(task.getStatus());
    }

    private boolean isApproved(OnboardingTaskEntity task) {
        return OnboardingTaskStatus.APPROVED.value().equals(task.getStatus());
    }

    private boolean isApproved(OnboardingTaskResponse task) {
        return OnboardingTaskStatus.APPROVED.value().equals(task.getStatus());
    }

    private OnboardingTaskResponse mapTask(OnboardingTaskEntity task) {
        UUID clientServiceId = task.getClientService() == null ? null : task.getClientService().getId();

        return new OnboardingTaskResponse(
                task.getId(),
                task.getClient().getId(),
                clientServiceId,
                task.getServiceKey(),
                task.getSectorType(),
                task.getTaskKey(),
                task.getTitle(),
                task.getDescription(),
                task.getTaskType(),
                task.getStatus(),
                task.isRequired(),
                task.isCritical(),
                task.getSortOrder(),
                task.getDataJson(),
                task.getFileMetadataJson(),
                task.getSignatureFullName(),
                task.getSignatureDocumentId(),
                task.isSignatureConsent(),
                task.getAdminFeedback(),
                task.getSubmittedAt(),
                task.getApprovedAt(),
                task.getRejectedAt(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private OnboardingFileResponse mapFile(OnboardingFileEntity file) {
        return new OnboardingFileResponse(
                file.getId(),
                file.getTask().getId(),
                file.getClient().getId(),
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSizeBytes(),
                file.getChecksumSha256(),
                file.getCreatedAt()
        );
    }

    public record OnboardingFileDownload(OnboardingFileEntity file, InputStream inputStream) {}

    private String metadata(String key, String value) {
        return toJson(Map.of(key, value == null ? "" : value));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Could not serialize onboarding data", ex);
        }
    }

    private String trimToLimit(String value, int limit) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.length() <= limit ? trimmed : trimmed.substring(0, limit);
    }
}
