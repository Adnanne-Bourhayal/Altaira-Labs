package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum UserRole {
    ADMIN("admin"),
    CONSULTANT("consultant"),
    AUDITOR("auditor"),
    CLIENT_USER("client_user"),
    VIEWER("viewer");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static UserRole parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("User role is required");
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(role -> role.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid user role"));
    }

    public boolean isAdminRole() {
        return this == ADMIN || this == CONSULTANT || this == AUDITOR;
    }

    public boolean isClientRole() {
        return this == CLIENT_USER || this == VIEWER;
    }
}
