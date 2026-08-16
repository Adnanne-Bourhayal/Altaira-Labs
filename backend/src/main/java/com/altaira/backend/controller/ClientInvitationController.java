package com.altaira.backend.controller;

import com.altaira.backend.dto.auth.LoginResponse;
import com.altaira.backend.dto.clientinvitation.AcceptClientInvitationRequest;
import com.altaira.backend.service.ClientInvitationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client-invitations")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ClientInvitationController {

    private final ClientInvitationService clientInvitationService;

    public ClientInvitationController(ClientInvitationService clientInvitationService) {
        this.clientInvitationService = clientInvitationService;
    }

    @PostMapping("/accept")
    public ResponseEntity<LoginResponse> acceptInvitation(
            @Valid @RequestBody AcceptClientInvitationRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(clientInvitationService.acceptInvitation(
                request,
                clientIp(httpRequest),
                userAgent(httpRequest)
        ));
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
