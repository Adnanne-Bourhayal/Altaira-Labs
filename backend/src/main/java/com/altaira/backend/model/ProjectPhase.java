package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum ProjectPhase {
    REQUIREMENTS("requirements"),
    DESIGN("design"),
    DEVELOPMENT("development"),
    REVIEW("review"),
    LAUNCH("launch");

    private final String value;

    ProjectPhase(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ProjectPhase parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return REQUIREMENTS;
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT)
                .replace("-", "_")
                .replace(" ", "_");

        return Arrays.stream(values())
                .filter(phase -> phase.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid project phase"));
    }
}
