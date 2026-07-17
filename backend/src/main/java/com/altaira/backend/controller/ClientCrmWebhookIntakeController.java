package com.altaira.backend.controller;

import com.altaira.backend.dto.clientcrm.ClientCrmLeadResponse;
import com.altaira.backend.dto.clientcrm.CreateClientCrmLeadRequest;
import com.altaira.backend.service.ClientCrmLeadService;
import com.altaira.backend.service.ClientCrmWebhookTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/client-crm/webhooks")
@CrossOrigin(origins = "*", allowedHeaders = {
        "Content-Type",
        "X-Altaira-Webhook-Key",
        "Authorization"
})
public class ClientCrmWebhookIntakeController {

    private final ClientCrmWebhookTokenService tokenService;
    private final ClientCrmLeadService leadService;

    public ClientCrmWebhookIntakeController(
            ClientCrmWebhookTokenService tokenService,
            ClientCrmLeadService leadService
    ) {
        this.tokenService = tokenService;
        this.leadService = leadService;
    }

    @PostMapping("/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public ClientCrmLeadResponse createLeadFromWebhook(
            @Valid @RequestBody CreateClientCrmLeadRequest request,
            @RequestHeader(name = "X-Altaira-Webhook-Key", required = false) String webhookKey,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        var token = tokenService.requireActiveToken(extractApiKey(webhookKey, authorization));
        return leadService.createClientLeadFromWebhook(token, request);
    }

    private String extractApiKey(String webhookKey, String authorization) {
        if (webhookKey != null && !webhookKey.isBlank()) {
            return webhookKey.trim();
        }

        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring("Bearer ".length()).trim();
        }

        return "";
    }
}
