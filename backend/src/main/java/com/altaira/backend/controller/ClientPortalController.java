package com.altaira.backend.controller;

import com.altaira.backend.dto.clientportal.AdminActionItemResponse;
import com.altaira.backend.dto.clientportal.AdminClientProjectSummaryResponse;
import com.altaira.backend.dto.clientportal.ClientPortalResponse;
import com.altaira.backend.dto.clientportal.ClientProjectAssetResponse;
import com.altaira.backend.dto.clientportal.ClientProjectConfigSnapshotResponse;
import com.altaira.backend.dto.clientportal.ClientProjectResponse;
import com.altaira.backend.dto.clientportal.CreateClientProjectConfigSnapshotRequest;
import com.altaira.backend.dto.clientportal.CreateProjectLinkRequest;
import com.altaira.backend.dto.clientportal.ReviewProjectAssetRequest;
import com.altaira.backend.dto.clientportal.SubmitProjectFeedbackRequest;
import com.altaira.backend.dto.clientportal.UpdateClientProjectRequest;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.security.ClientAccessService;
import com.altaira.backend.service.ClientPortalService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/client-portal")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientPortalController {

    private final ClientAccessService clientAccessService;
    private final AdminAccessService adminAccessService;
    private final ClientPortalService clientPortalService;

    public ClientPortalController(
            ClientAccessService clientAccessService,
            AdminAccessService adminAccessService,
            ClientPortalService clientPortalService
    ) {
        this.clientAccessService = clientAccessService;
        this.adminAccessService = adminAccessService;
        this.clientPortalService = clientPortalService;
    }

    @GetMapping("/me")
    public ClientPortalResponse getMyPortal(
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return clientPortalService.getPortal(context);
    }

    @PatchMapping("/client/projects/{projectId}/feedback")
    public ClientProjectResponse submitProjectFeedback(
            @PathVariable UUID projectId,
            @Valid @RequestBody SubmitProjectFeedbackRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientPortalService.submitProjectFeedback(context, projectId, request);
    }

    @GetMapping("/client/projects/{projectId}/assets")
    public List<ClientProjectAssetResponse> listProjectAssets(
            @PathVariable UUID projectId,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        return clientPortalService.listProjectAssets(context, projectId);
    }

    @PostMapping(value = "/client/projects/{projectId}/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<ClientProjectAssetResponse> uploadProjectAssets(
            @PathVariable UUID projectId,
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart(name = "assetType", required = false) String assetType,
            @RequestPart(name = "notes", required = false) String notes,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientPortalService.uploadProjectAssets(context, projectId, files, assetType, notes);
    }

    @PostMapping("/client/projects/{projectId}/links")
    public ClientProjectAssetResponse createProjectLink(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateProjectLinkRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return clientPortalService.createProjectLink(context, projectId, request);
    }

    @GetMapping("/admin/clients/{clientId}")
    public ClientPortalResponse getClientPortalAsAdmin(
            @PathVariable UUID clientId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.getPortalForAdmin(clientId);
    }

    @GetMapping("/admin/projects")
    public List<AdminClientProjectSummaryResponse> listProjectsAsAdmin(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.listProjectsAsAdmin();
    }

    @GetMapping("/admin/actions")
    public List<AdminActionItemResponse> listActionItemsAsAdmin(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.listActionItemsAsAdmin();
    }

    @PatchMapping("/admin/projects/{projectId}")
    public ClientProjectResponse updateProjectAsAdmin(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateClientProjectRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.updateProjectAsAdmin(projectId, request);
    }

    @GetMapping("/admin/projects/{projectId}/assets")
    public List<ClientProjectAssetResponse> listProjectAssetsAsAdmin(
            @PathVariable UUID projectId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.listProjectAssetsAsAdmin(projectId);
    }

    @GetMapping("/admin/projects/{projectId}/config-snapshots")
    public List<ClientProjectConfigSnapshotResponse> listProjectConfigSnapshotsAsAdmin(
            @PathVariable UUID projectId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.listProjectConfigSnapshotsAsAdmin(projectId);
    }

    @PostMapping("/admin/projects/{projectId}/config-snapshots")
    public ClientProjectConfigSnapshotResponse createProjectConfigSnapshotAsAdmin(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateClientProjectConfigSnapshotRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        var adminUser = adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        String createdByUsername = adminUser == null ? "internal_api" : adminUser.getUsername();
        return clientPortalService.createProjectConfigSnapshotAsAdmin(projectId, request, createdByUsername);
    }

    @PatchMapping("/admin/project-assets/{assetId}/approve")
    public ClientProjectAssetResponse approveProjectAssetAsAdmin(
            @PathVariable UUID assetId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.approveProjectAssetAsAdmin(assetId);
    }

    @PatchMapping("/admin/project-assets/{assetId}/reject")
    public ClientProjectAssetResponse rejectProjectAssetAsAdmin(
            @PathVariable UUID assetId,
            @Valid @RequestBody ReviewProjectAssetRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return clientPortalService.rejectProjectAssetAsAdmin(assetId, request);
    }

    @GetMapping("/admin/project-assets/{assetId}/download")
    public ResponseEntity<InputStreamResource> downloadProjectAssetAsAdmin(
            @PathVariable UUID assetId,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) throws IOException {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        var download = clientPortalService.getProjectAssetDownloadAsAdmin(assetId);
        var asset = download.asset();
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;

        if (asset.getContentType() != null && !asset.getContentType().isBlank()) {
            try {
                contentType = MediaType.parseMediaType(asset.getContentType());
            } catch (IllegalArgumentException ignored) {
                contentType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(asset.getSizeBytes())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(asset.getOriginalFilename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(new InputStreamResource(Files.newInputStream(download.path())));
    }
}
