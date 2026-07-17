package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum OnboardingTaskType {
    SIGNATURE("signature"),
    FILE_UPLOAD("file_upload"),
    PREFERENCES_FORM("preferences_form");

    private final String value;

    OnboardingTaskType(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static OnboardingTaskType parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Onboarding task type is required");
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(type -> type.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid onboarding task type"));
    }
}
