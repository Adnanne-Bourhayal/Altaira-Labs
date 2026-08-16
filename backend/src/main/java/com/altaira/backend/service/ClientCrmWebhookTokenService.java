package com.altaira.backend.service;

import com.altaira.backend.dto.clientcrm.ClientCrmWebhookTokenResponse;
import com.altaira.backend.dto.clientcrm.CreateClientCrmWebhookTokenRequest;
import com.altaira.backend.entity.ClientCrmWebhookTokenEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.repository.ClientCrmWebhookTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ClientCrmWebhookTokenService {

    private static final String TOKEN_PREFIX = "alw_";
    private static final String DEFAULT_WEBHOOK_PATH = "/api/v1/client-crm/webhooks/leads";

    private final ClientCrmWebhookTokenRepository tokenRepository;
    private final ClientManagementService clientManagementService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String publicWebhookUrl;

    public ClientCrmWebhookTokenService(
            ClientCrmWebhookTokenRepository tokenRepository,
            ClientManagementService clientManagementService,
            @Value("${altaira.client-crm.webhook.public-url:}") String publicWebhookUrl
    ) {
        this.tokenRepository = tokenRepository;
        this.clientManagementService = clientManagementService;
        this.publicWebhookUrl = publicWebhookUrl;
    }

    @Transactional(readOnly = true)
    public List<ClientCrmWebhookTokenResponse> listTokens(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        return tokenRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(token -> map(token, null))
                .toList();
    }

    public ClientCrmWebhookTokenResponse createToken(UUID clientId, CreateClientCrmWebhookTokenRequest request) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        String apiKey = generateUniqueApiKey();

        ClientCrmWebhookTokenEntity token = new ClientCrmWebhookTokenEntity();
        token.setClient(client);
        token.setLabel(normalizeLabel(request == null ? null : request.getLabel()));
        token.setTokenHash(hashToken(apiKey));
        token.setTokenPrefix(apiKey.substring(0, Math.min(apiKey.length(), 16)));
        token.setActive(true);

        return map(tokenRepository.save(token), apiKey);
    }

    public ClientCrmWebhookTokenResponse revokeToken(UUID clientId, UUID tokenId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        ClientCrmWebhookTokenEntity token = tokenRepository.findByIdAndClient(tokenId, client)
                .orElseThrow(() -> new ResourceNotFoundException("Client CRM webhook token", tokenId));

        token.setActive(false);
        token.setRevokedAt(Instant.now());
        return map(tokenRepository.save(token), null);
    }

    public ClientCrmWebhookTokenEntity requireActiveToken(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Client CRM webhook API key is required");
        }

        ClientCrmWebhookTokenEntity token = tokenRepository.findByTokenHashAndActiveTrue(hashToken(apiKey.trim()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid client CRM webhook API key"));

        token.setLastUsedAt(Instant.now());
        return tokenRepository.save(token);
    }

    private String generateUniqueApiKey() {
        for (int attempt = 0; attempt < 10; attempt++) {
            byte[] randomBytes = new byte[32];
            secureRandom.nextBytes(randomBytes);
            String apiKey = TOKEN_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

            if (!tokenRepository.existsByTokenHash(hashToken(apiKey))) {
                return apiKey;
            }
        }

        throw new IllegalStateException("Could not generate a unique CRM webhook API key");
    }

    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) {
            return "Website form";
        }

        String trimmed = label.trim();
        return trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash CRM webhook API key", ex);
        }
    }

    private ClientCrmWebhookTokenResponse map(ClientCrmWebhookTokenEntity token, String apiKey) {
        return new ClientCrmWebhookTokenResponse(
                token.getId(),
                token.getClient().getId(),
                token.getLabel(),
                token.getTokenPrefix(),
                token.isActive(),
                apiKey,
                publicWebhookUrl == null || publicWebhookUrl.isBlank() ? DEFAULT_WEBHOOK_PATH : publicWebhookUrl,
                token.getLastUsedAt(),
                token.getRevokedAt(),
                token.getCreatedAt(),
                token.getUpdatedAt()
        );
    }
}
