package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum UserRole {
    ADMIN("admin"),
    CONSULTANT("consultant"),
    AUDITOR("auditor");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static UserRole parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return ADMIN;
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(role -> role.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid user role"));
    }
}
