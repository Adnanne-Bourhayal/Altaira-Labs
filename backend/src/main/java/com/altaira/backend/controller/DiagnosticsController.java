package com.altaira.backend.controller;

import com.altaira.backend.dto.diagnostics.EmailDiagnosticsResponse;
import com.altaira.backend.security.AdminAccessService;
import com.altaira.backend.service.LeadNotificationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/diagnostics")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class DiagnosticsController {

    private final LeadNotificationService leadNotificationService;
    private final AdminAccessService adminAccessService;

    public DiagnosticsController(LeadNotificationService leadNotificationService, AdminAccessService adminAccessService) {
        this.leadNotificationService = leadNotificationService;
        this.adminAccessService = adminAccessService;
    }

    @GetMapping("/email")
    public EmailDiagnosticsResponse emailDiagnostics(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken,
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String adminSessionToken
    ) {
        adminAccessService.requireAdminAccess(internalApiToken, adminSessionToken);
        return leadNotificationService.getDiagnostics();
    }
}
