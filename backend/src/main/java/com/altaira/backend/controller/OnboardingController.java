package com.altaira.backend.controller;

import com.altaira.backend.dto.onboarding.OnboardingFileResponse;
import com.altaira.backend.dto.onboarding.OnboardingDashboardResponse;
import com.altaira.backend.dto.onboarding.OnboardingTaskResponse;
import com.altaira.backend.dto.onboarding.ReviewOnboardingTaskRequest;
import com.altaira.backend.dto.onboarding.SubmitOnboardingTaskRequest;
import com.altaira.backend.dto.media.CompletePrivateUploadRequest;
import com.altaira.backend.dto.media.PreparePrivateUploadRequest;
import com.altaira.backend.dto.media.UploadUrlResponse;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.security.ClientAccessService;
import com.altaira.backend.service.AuthService;
import com.altaira.backend.service.OnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/onboarding")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final ClientAccessService clientAccessService;
    private final AdminAccessService adminAccessService;
    private final AuthService authService;

    public OnboardingController(
            OnboardingService onboardingService,
            ClientAccessService clientAccessService,
            AdminAccessService adminAccessService,
            AuthService authService
    ) {
        this.onboardingService = onboardingService;
        this.clientAccessService = clientAccessService;
        this.adminAccessService = adminAccessService;
        this.authService = authService;
    }

    @GetMapping("/client/me")
    public OnboardingDashboardResponse getMyOnboarding(
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return onboardingService.getClientDashboard(context);
    }

    @PatchMapping("/client/tasks/{taskId}/submit")
    public OnboardingTaskResponse submitClientTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody SubmitOnboardingTaskRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken,
            HttpServletRequest httpRequest
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return onboardingService.submitClientTask(
                context,
                taskId,
                request,
                clientIp(httpRequest),
                userAgent(httpRequest)
        );
    }

    @PostMapping(value = "/client/tasks/{taskId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OnboardingTaskResponse submitClientFiles(
            @PathVariable UUID taskId,
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart(name = "notes", required = false) String notes,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken,
            HttpServletRequest httpRequest
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return onboardingService.submitClientFiles(
                context,
                taskId,
                files,
                notes,
                clientIp(httpRequest),
                userAgent(httpRequest)
        );
    }

    @PostMapping("/client/tasks/{taskId}/upload-url")
    public UploadUrlResponse prepareClientTaskUpload(
            @PathVariable UUID taskId,
            @Valid @RequestBody PreparePrivateUploadRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return onboardingService.prepareClientTaskUpload(context, taskId, request);
    }

    @PostMapping("/client/tasks/{taskId}/files/complete")
    public OnboardingTaskResponse completeClientTaskUpload(
            @PathVariable UUID taskId,
            @Valid @RequestBody CompletePrivateUploadRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken,
            HttpServletRequest httpRequest
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return onboardingService.completeClientTaskUpload(
                context,
                taskId,
                request,
                clientIp(httpRequest),
                userAgent(httpRequest)
        );
    }

    @GetMapping("/client/files/{fileId}/download")
    public ResponseEntity<InputStreamResource> downloadClientTaskFile(
            @PathVariable UUID fileId,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) throws IOException {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        var download = onboardingService.getFileDownload(context, fileId);
        var file = download.file();
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;

        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            try {
                contentType = MediaType.parseMediaType(file.getContentType());
            } catch (IllegalArgumentException ignored) {
                contentType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(file.getSizeBytes())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.getOriginalFilename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(new InputStreamResource(download.inputStream()));
    }

    @GetMapping("/admin/clients/{clientId}")
    public OnboardingDashboardResponse getClientOnboardingAsAdmin(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return onboardingService.getAdminDashboard(clientId);
    }

    @PostMapping("/admin/clients/{clientId}/generate")
    public OnboardingDashboardResponse generateClientOnboardingAsAdmin(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return onboardingService.regenerateAdminDashboard(clientId);
    }

    @PatchMapping("/admin/tasks/{taskId}/approve")
    public OnboardingTaskResponse approveTask(
            @PathVariable UUID taskId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken,
            HttpServletRequest httpRequest
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return onboardingService.approveTask(taskId, optionalAdminUser(adminSessionToken), clientIp(httpRequest), userAgent(httpRequest));
    }

    @PatchMapping("/admin/tasks/{taskId}/reject")
    public OnboardingTaskResponse rejectTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody ReviewOnboardingTaskRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken,
            HttpServletRequest httpRequest
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return onboardingService.rejectTask(
                taskId,
                request.getFeedback(),
                optionalAdminUser(adminSessionToken),
                clientIp(httpRequest),
                userAgent(httpRequest)
        );
    }

    @GetMapping("/admin/tasks/{taskId}/files")
    public List<OnboardingFileResponse> listTaskFiles(
            @PathVariable UUID taskId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return onboardingService.listTaskFilesAsAdmin(taskId);
    }

    @GetMapping("/admin/files/{fileId}/download")
    public ResponseEntity<InputStreamResource> downloadTaskFile(
            @PathVariable UUID fileId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) throws IOException {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        var download = onboardingService.getFileDownloadAsAdmin(fileId);
        var file = download.file();
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;

        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            try {
                contentType = MediaType.parseMediaType(file.getContentType());
            } catch (IllegalArgumentException ignored) {
                contentType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(file.getSizeBytes())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.getOriginalFilename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(new InputStreamResource(download.inputStream()));
    }

    private AppUserEntity optionalAdminUser(String adminSessionToken) {
        try {
            return authService.getCurrentUserEntity(adminSessionToken);
        } catch (ResponseStatusException ex) {
            return null;
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private String userAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
