package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum ClientStatus {
    ACTIVE("active"),
    PAUSED("paused"),
    ARCHIVED("archived");

    private final String value;

    ClientStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ClientStatus parse(String status) {
        if (status == null || status.isBlank()) {
            return ACTIVE;
        }

        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(clientStatus -> clientStatus.value.equals(normalizedStatus))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid client status"));
    }
}
