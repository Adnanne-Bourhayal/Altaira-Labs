package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum ClientServiceStatus {
    PLANNED("planned"),
    IN_PROGRESS("in_progress"),
    REVIEW("review"),
    DELIVERED("delivered"),
    CANCELLED("cancelled");

    private final String value;

    ClientServiceStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ClientServiceStatus parse(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Client service status is required");
        }

        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(serviceStatus -> serviceStatus.value.equals(normalizedStatus))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid client service status"));
    }
}
