package com.altaira.backend.model;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

public enum WorkspaceTaskVisibility {
    ADMIN_ONLY,
    CLIENT_VISIBLE;

    public static WorkspaceTaskVisibility parse(String value) {
        if (value == null || value.isBlank()) {
            return ADMIN_ONLY;
        }

        try {
            return valueOf(value.trim().replace('-', '_').toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task visibility: " + value);
        }
    }

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }
}
