package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum OnboardingTaskStatus {
    PENDING("pending"),
    SUBMITTED("submitted"),
    APPROVED("approved"),
    REJECTED("rejected");

    private final String value;

    OnboardingTaskStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static OnboardingTaskStatus parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return PENDING;
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(status -> status.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid onboarding task status"));
    }
}
