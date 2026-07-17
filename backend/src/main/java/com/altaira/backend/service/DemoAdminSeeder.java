package com.altaira.backend.service;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.model.SecurityEventType;
import com.altaira.backend.model.UserRole;
import com.altaira.backend.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoAdminSeeder implements ApplicationRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityEventService securityEventService;
    private final boolean enabled;
    private final String username;
    private final String password;
    private final String role;

    public DemoAdminSeeder(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            SecurityEventService securityEventService,
            @Value("${altaira.auth.demo-admin.enabled}") boolean enabled,
            @Value("${altaira.auth.demo-admin.username}") String username,
            @Value("${altaira.auth.demo-admin.password}") String password,
            @Value("${altaira.auth.demo-admin.role}") String role
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityEventService = securityEventService;
        this.enabled = enabled;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled || username == null || username.isBlank() || password == null || password.isBlank()) {
            return;
        }

        String normalizedUsername = username.trim().toLowerCase();
        UserRole configuredRole = UserRole.parse(role);

        var existingUser = appUserRepository.findByUsernameIgnoreCase(normalizedUsername);
        if (existingUser.isPresent()) {
            AppUserEntity user = existingUser.get();
            boolean changed = false;

            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(password));
                changed = true;
            }

            if (!configuredRole.value().equals(user.getRole())) {
                user.setRole(configuredRole.value());
                changed = true;
            }

            if (!user.isActive()) {
                user.setActive(true);
                changed = true;
            }

            if (changed) {
                AppUserEntity savedUser = appUserRepository.save(user);
                securityEventService.record(
                        SecurityEventType.PASSWORD_CHANGED,
                        savedUser,
                        savedUser.getUsername(),
                        true,
                        null,
                        null,
                        "Explicitly enabled demo admin configuration reconciled by startup seeder"
                );
            }
            return;
        }

        AppUserEntity user = new AppUserEntity();
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(configuredRole.value());
        user.setActive(true);

        AppUserEntity savedUser = appUserRepository.save(user);
        securityEventService.record(
                SecurityEventType.USER_CREATED,
                savedUser,
                savedUser.getUsername(),
                true,
                null,
                null,
                "Demo/local/TFG admin user created by startup seeder"
        );
    }
}
