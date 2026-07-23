package com.altaira.backend.model;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

public enum WorkspaceTaskStatus {
    NOT_STARTED,
    IN_PROGRESS,
    SUBMITTED,
    NEEDS_REVIEW,
    APPROVED,
    REJECTED,
    BLOCKED,
    COMPLETED;

    public static WorkspaceTaskStatus parse(String value) {
        if (value == null || value.isBlank()) {
            return NOT_STARTED;
        }

        try {
            return valueOf(value.trim().replace('-', '_').toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task status: " + value);
        }
    }

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public boolean isFinished() {
        return this == APPROVED || this == COMPLETED;
    }
}
