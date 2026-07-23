package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum LeadAssessmentStatus {
    DRAFT("draft"),
    SUBMITTED("submitted"),
    REVIEWED("reviewed");

    private final String value;

    LeadAssessmentStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static LeadAssessmentStatus parseOrSubmitted(String value) {
        if (value == null || value.isBlank()) {
            return SUBMITTED;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(status -> status.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported lead assessment status"));
    }
}
