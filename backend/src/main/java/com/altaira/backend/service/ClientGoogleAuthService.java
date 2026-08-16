package com.altaira.backend.service;

import com.altaira.backend.dto.auth.GoogleClientLoginRequest;
import com.altaira.backend.dto.auth.LoginResponse;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.model.SecurityEventType;
import com.altaira.backend.model.UserRole;
import com.altaira.backend.repository.AppUserRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;

@Service
@Transactional
public class ClientGoogleAuthService {

    private final AppUserRepository appUserRepository;
    private final ClientUserAccessRepository clientUserAccessRepository;
    private final AuthService authService;
    private final SecurityEventService securityEventService;
    private final ObjectMapper objectMapper;
    private final String googleClientId;
    private final URI tokenInfoUrl;
    private final HttpClient httpClient;

    @Autowired
    public ClientGoogleAuthService(
            AppUserRepository appUserRepository,
            ClientUserAccessRepository clientUserAccessRepository,
            AuthService authService,
            SecurityEventService securityEventService,
            ObjectMapper objectMapper,
            @Value("${altaira.client.google.client-id}") String googleClientId,
            @Value("${altaira.client.google.token-info-url}") String tokenInfoUrl
    ) {
        this(
                appUserRepository,
                clientUserAccessRepository,
                authService,
                securityEventService,
                objectMapper,
                googleClientId,
                tokenInfoUrl,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build()
        );
    }

    ClientGoogleAuthService(
            AppUserRepository appUserRepository,
            ClientUserAccessRepository clientUserAccessRepository,
            AuthService authService,
            SecurityEventService securityEventService,
            ObjectMapper objectMapper,
            String googleClientId,
            String tokenInfoUrl,
            HttpClient httpClient
    ) {
        this.appUserRepository = appUserRepository;
        this.clientUserAccessRepository = clientUserAccessRepository;
        this.authService = authService;
        this.securityEventService = securityEventService;
        this.objectMapper = objectMapper;
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.tokenInfoUrl = URI.create((tokenInfoUrl == null || tokenInfoUrl.isBlank()) ? "https://oauth2.googleapis.com/tokeninfo" : tokenInfoUrl.trim());
        this.httpClient = httpClient;
    }

    public LoginResponse login(GoogleClientLoginRequest request, String ipAddress, String userAgent) {
        if (googleClientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google client login is not configured");
        }

        GoogleIdentity identity = verifyGoogleCredential(request.getCredential());
        String email = identity.email();

        AppUserEntity user = appUserRepository.findByUsernameIgnoreCase(email)
                .orElseThrow(() -> unauthorizedGoogleLogin(email, ipAddress, userAgent, "Google email is not invited"));

        UserRole role = UserRole.parse(user.getRole());
        if (!user.isActive() || !role.isClientRole()) {
            throw unauthorizedGoogleLogin(email, ipAddress, userAgent, "Google email is not an active client user");
        }

        var activeAccesses = clientUserAccessRepository.findAllByUserAndActiveTrue(user);
        if (activeAccesses.isEmpty()) {
            throw unauthorizedGoogleLogin(email, ipAddress, userAgent, "Google email has no active client workspace access");
        }

        if (activeAccesses.size() > 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Multiple active client workspaces require explicit workspace selection"
            );
        }

        return authService.createSessionForUser(user, ipAddress, userAgent, "Client Google login");
    }

    private GoogleIdentity verifyGoogleCredential(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google credential is required");
        }

        URI requestUri = URI.create(tokenInfoUrl + "?id_token=" + URLEncoder.encode(credential.trim(), StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(requestUri)
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        JsonNode json;
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
            }
            json = objectMapper.readTree(response.body());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Could not verify Google credential");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google credential verification interrupted");
        }

        String audience = text(json, "aud");
        if (!googleClientId.equals(audience)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential audience");
        }

        if (!"true".equalsIgnoreCase(text(json, "email_verified"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        String email = text(json, "email").trim().toLowerCase(Locale.ROOT);
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google credential does not include an email");
        }

        return new GoogleIdentity(email);
    }

    private ResponseStatusException unauthorizedGoogleLogin(String email, String ipAddress, String userAgent, String metadata) {
        securityEventService.record(
                SecurityEventType.LOGIN_FAILED,
                null,
                email,
                false,
                ipAddress,
                userAgent,
                metadata
        );
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account is not invited to a client workspace");
    }

    private String text(JsonNode json, String fieldName) {
        JsonNode value = json == null ? null : json.get(fieldName);
        return value == null || value.isNull() ? "" : value.asText("");
    }

    private record GoogleIdentity(String email) {}
}
