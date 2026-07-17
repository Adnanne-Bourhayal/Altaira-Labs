package com.altaira.backend.service;

import com.altaira.backend.dto.auth.LoginResponse;
import com.altaira.backend.dto.clientinvitation.AcceptClientInvitationRequest;
import com.altaira.backend.dto.clientinvitation.ClientInvitationResponse;
import com.altaira.backend.dto.clientinvitation.CreateClientInvitationRequest;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientInvitationEntity;
import com.altaira.backend.entity.ClientUserAccessEntity;
import com.altaira.backend.model.SecurityEventType;
import com.altaira.backend.repository.AppUserRepository;
import com.altaira.backend.repository.ClientInvitationRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ClientInvitationService {

    private final ClientManagementService clientManagementService;
    private final ClientInvitationRepository clientInvitationRepository;
    private final AppUserRepository appUserRepository;
    private final ClientUserAccessRepository clientUserAccessRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final SecurityEventService securityEventService;
    private final OnboardingNotificationService onboardingNotificationService;
    private final String activateUrl;
    private final long expiresDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public ClientInvitationService(
            ClientManagementService clientManagementService,
            ClientInvitationRepository clientInvitationRepository,
            AppUserRepository appUserRepository,
            ClientUserAccessRepository clientUserAccessRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            SecurityEventService securityEventService,
            OnboardingNotificationService onboardingNotificationService,
            @Value("${altaira.client.invitation.activate-url}") String activateUrl,
            @Value("${altaira.client.invitation.expires-days}") long expiresDays
    ) {
        this.clientManagementService = clientManagementService;
        this.clientInvitationRepository = clientInvitationRepository;
        this.appUserRepository = appUserRepository;
        this.clientUserAccessRepository = clientUserAccessRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.securityEventService = securityEventService;
        this.onboardingNotificationService = onboardingNotificationService;
        this.activateUrl = activateUrl == null || activateUrl.isBlank() ? "http://localhost:3000/client/activate" : activateUrl.trim();
        this.expiresDays = Math.max(expiresDays, 1);
    }

    public ClientInvitationResponse createInvitation(UUID clientId, CreateClientInvitationRequest request, AppUserEntity adminUser, String ipAddress, String userAgent) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        String email = normalizeEmail(request.getEmail() == null || request.getEmail().isBlank() ? client.getEmail() : request.getEmail());
        String role = normalizeRole(request.getRole());
        Instant now = Instant.now();

        clientInvitationRepository.findAllByClientAndEmailIgnoreCaseAndAcceptedAtIsNullAndRevokedAtIsNull(client, email)
                .forEach(invitation -> invitation.setRevokedAt(now));

        String token = createRawToken();
        String invitationUrl = invitationUrl(token);

        ClientInvitationEntity invitation = new ClientInvitationEntity();
        invitation.setClient(client);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setTokenHash(hashToken(token));
        invitation.setExpiresAt(now.plus(expiresDays, ChronoUnit.DAYS));

        EmailNotificationResult emailResult = onboardingNotificationService.sendClientInvitation(client, invitationUrl);
        invitation.setEmailSent(emailResult.sent());
        invitation.setEmailMessage(trimToLimit(emailResult.message(), 300));

        ClientInvitationEntity saved = clientInvitationRepository.save(invitation);
        securityEventService.record(
                SecurityEventType.CLIENT_INVITATION_CREATED,
                adminUser,
                email,
                true,
                ipAddress,
                userAgent,
                "Client invitation created for client " + client.getId()
        );

        return map(saved, invitationUrl);
    }

    @Transactional(readOnly = true)
    public List<ClientInvitationResponse> listInvitations(UUID clientId) {
        ClientEntity client = clientManagementService.findClientEntity(clientId);
        return clientInvitationRepository.findAllByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(invitation -> map(invitation, null))
                .toList();
    }

    public LoginResponse acceptInvitation(AcceptClientInvitationRequest request, String ipAddress, String userAgent) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        String tokenHash = hashToken(request.getToken().trim());
        ClientInvitationEntity invitation = clientInvitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        Instant now = Instant.now();

        if (invitation.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation has been revoked");
        }

        if (invitation.getAcceptedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation has already been accepted");
        }

        if (invitation.getExpiresAt().isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation has expired");
        }

        AppUserEntity user = appUserRepository.findByUsernameIgnoreCase(invitation.getEmail())
                .orElseGet(AppUserEntity::new);
        boolean isNewUser = user.getId() == null;

        if (!isNewUser && !("client_user".equals(user.getRole()) || "viewer".equals(user.getRole()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invitation email is already used by a non-client account");
        }

        if (!isNewUser && clientUserAccessRepository.findAllByUserAndActiveTrue(user).stream()
                .anyMatch(existingAccess -> !existingAccess.getClient().getId().equals(invitation.getClient().getId()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Client account is already linked to another active workspace"
            );
        }

        user.setUsername(invitation.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(invitation.getRole());
        user.setActive(true);
        AppUserEntity savedUser = appUserRepository.save(user);

        ClientUserAccessEntity access = clientUserAccessRepository.findByUserAndClient(savedUser, invitation.getClient())
                .orElseGet(ClientUserAccessEntity::new);
        access.setUser(savedUser);
        access.setClient(invitation.getClient());
        access.setRole(invitation.getRole());
        access.setActive(true);
        clientUserAccessRepository.save(access);

        invitation.setAcceptedAt(now);
        clientInvitationRepository.save(invitation);

        securityEventService.record(
                isNewUser ? SecurityEventType.USER_CREATED : SecurityEventType.PASSWORD_CHANGED,
                null,
                savedUser.getUsername(),
                true,
                ipAddress,
                userAgent,
                isNewUser ? "Client user created from invitation" : "Client user password reset from invitation"
        );
        securityEventService.record(
                SecurityEventType.CLIENT_INVITATION_ACCEPTED,
                null,
                savedUser.getUsername(),
                true,
                ipAddress,
                userAgent,
                "Client invitation accepted for client " + invitation.getClient().getId()
        );

        return authService.createSessionForUser(savedUser, ipAddress, userAgent, "Client invitation accepted", false);
    }

    private ClientInvitationResponse map(ClientInvitationEntity invitation, String invitationUrl) {
        return new ClientInvitationResponse(
                invitation.getId(),
                invitation.getClient().getId(),
                invitation.getEmail(),
                invitation.getRole(),
                status(invitation),
                invitation.getExpiresAt(),
                invitation.getAcceptedAt(),
                invitation.getRevokedAt(),
                invitation.isEmailSent(),
                invitation.getEmailMessage(),
                invitationUrl,
                invitation.getCreatedAt(),
                invitation.getUpdatedAt()
        );
    }

    private String status(ClientInvitationEntity invitation) {
        Instant now = Instant.now();

        if (invitation.getAcceptedAt() != null) {
            return "accepted";
        }

        if (invitation.getRevokedAt() != null) {
            return "revoked";
        }

        if (invitation.getExpiresAt().isBefore(now)) {
            return "expired";
        }

        return "pending";
    }

    private String invitationUrl(String token) {
        String separator = activateUrl.contains("?") ? "&" : "?";
        return activateUrl + separator + "token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String normalizeEmail(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Client invitation email is required");
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeRole(String value) {
        if (value == null || value.isBlank()) {
            return "client_user";
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!("client_user".equals(normalized) || "viewer".equals(normalized))) {
            throw new IllegalArgumentException("Client invitation role must be client_user or viewer");
        }

        return normalized;
    }

    private String createRawToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
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
