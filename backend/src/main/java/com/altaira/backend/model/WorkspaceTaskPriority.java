package com.altaira.backend.model;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

public enum WorkspaceTaskPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT;

    public static WorkspaceTaskPriority parse(String value) {
        if (value == null || value.isBlank()) {
            return NORMAL;
        }

        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task priority: " + value);
        }
    }

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }
}
