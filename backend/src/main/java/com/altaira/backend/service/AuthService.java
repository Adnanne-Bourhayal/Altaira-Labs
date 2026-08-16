package com.altaira.backend.service;

import com.altaira.backend.dto.auth.AuthUserResponse;
import com.altaira.backend.dto.auth.LoginRequest;
import com.altaira.backend.dto.auth.LoginResponse;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.AppUserSessionEntity;
import com.altaira.backend.model.SecurityEventType;
import com.altaira.backend.model.UserRole;
import com.altaira.backend.repository.AppUserRepository;
import com.altaira.backend.repository.AppUserSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.function.Predicate;

@Service
@Transactional
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AppUserSessionRepository appUserSessionRepository;
    private final SecurityEventService securityEventService;
    private final PasswordEncoder passwordEncoder;
    private final long sessionHours;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            AppUserRepository appUserRepository,
            AppUserSessionRepository appUserSessionRepository,
            SecurityEventService securityEventService,
            PasswordEncoder passwordEncoder,
            @Value("${altaira.auth.session-hours}") long sessionHours
    ) {
        this.appUserRepository = appUserRepository;
        this.appUserSessionRepository = appUserSessionRepository;
        this.securityEventService = securityEventService;
        this.passwordEncoder = passwordEncoder;
        this.sessionHours = sessionHours;
    }

    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        return loginForAudience(request, ipAddress, userAgent, role -> true, null);
    }

    public LoginResponse loginAdmin(LoginRequest request, String ipAddress, String userAgent) {
        return loginForAudience(request, ipAddress, userAgent, UserRole::isAdminRole, "Admin role required");
    }

    public LoginResponse loginClient(LoginRequest request, String ipAddress, String userAgent) {
        return loginForAudience(request, ipAddress, userAgent, UserRole::isClientRole, "Client role required");
    }

    private LoginResponse loginForAudience(
            LoginRequest request,
            String ipAddress,
            String userAgent,
            Predicate<UserRole> allowedRole,
            String roleError
    ) {
        String username = normalizeUsername(request.getUsername());
        String password = request.getPassword() == null ? "" : request.getPassword();

        var user = appUserRepository.findByUsernameIgnoreCase(username);

        if (user.isEmpty() || !user.get().isActive() || !passwordEncoder.matches(password, user.get().getPasswordHash())) {
            securityEventService.record(
                    SecurityEventType.LOGIN_FAILED,
                    user.orElse(null),
                    username,
                    false,
                    ipAddress,
                    userAgent,
                    "Invalid username, inactive user, or invalid password"
            );
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        AppUserEntity entity = user.get();

        if (!allowedRole.test(UserRole.parse(entity.getRole()))) {
            securityEventService.record(
                    SecurityEventType.LOGIN_FAILED,
                    entity,
                    username,
                    false,
                    ipAddress,
                    userAgent,
                    "Role is not allowed for the requested login audience"
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, roleError);
        }

        return createSessionForUser(entity, ipAddress, userAgent, "Session created");
    }

    public LoginResponse createSessionForUser(AppUserEntity entity, String ipAddress, String userAgent, String metadata) {
        return createSessionForUser(entity, ipAddress, userAgent, metadata, true);
    }

    public LoginResponse createSessionForUser(AppUserEntity entity, String ipAddress, String userAgent, String metadata, boolean linkSecurityEventToUser) {
        Instant now = Instant.now();
        entity.setLastLoginAt(now);
        revokeExistingSessions(entity, now);

        String sessionToken = createSessionToken();
        Instant expiresAt = now.plus(Math.max(sessionHours, 1), ChronoUnit.HOURS);

        AppUserSessionEntity session = new AppUserSessionEntity();
        session.setUser(entity);
        session.setSessionTokenHash(hashToken(sessionToken));
        session.setExpiresAt(expiresAt);
        appUserSessionRepository.save(session);

        securityEventService.record(
                SecurityEventType.LOGIN_SUCCESS,
                linkSecurityEventToUser ? entity : null,
                entity.getUsername(),
                true,
                ipAddress,
                userAgent,
                metadata == null || metadata.isBlank() ? "Session created" : metadata
        );

        return new LoginResponse(sessionToken, expiresAt, mapUser(entity));
    }

    public AuthUserResponse getCurrentUser(String sessionToken) {
        AppUserSessionEntity session = findUsableSession(sessionToken);
        return mapUser(session.getUser());
    }

    public AppUserEntity getCurrentUserEntity(String sessionToken) {
        return findUsableSession(sessionToken).getUser();
    }

    public void logout(String sessionToken, String ipAddress, String userAgent) {
        if (sessionToken == null || sessionToken.isBlank()) {
            return;
        }

        appUserSessionRepository.findBySessionTokenHash(hashToken(sessionToken))
                .ifPresent(session -> {
                    if (session.getRevokedAt() == null) {
                        session.setRevokedAt(Instant.now());
                        securityEventService.record(
                                SecurityEventType.LOGOUT,
                                session.getUser(),
                                session.getUser().getUsername(),
                                true,
                                ipAddress,
                                userAgent,
                                "Session revoked"
                        );
                    }
                });
    }

    AppUserSessionEntity findUsableSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing admin session");
        }

        AppUserSessionEntity session = appUserSessionRepository.findBySessionTokenHash(hashToken(sessionToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin session"));

        if (!session.isUsable(Instant.now()) || !session.getUser().isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin session");
        }

        return session;
    }

    public AuthUserResponse mapUser(AppUserEntity user) {
        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt()
        );
    }

    private void revokeExistingSessions(AppUserEntity user, Instant now) {
        appUserSessionRepository.findAllByUserAndRevokedAtIsNull(user)
                .forEach(session -> {
                    if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(now)) {
                        session.setRevokedAt(now);
                    }
                });
    }

    public String hashToken(String sessionToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sessionToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private String createSessionToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            return "";
        }

        return username.trim().toLowerCase();
    }
}
