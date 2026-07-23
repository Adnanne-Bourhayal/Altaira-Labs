package com.altaira.backend.model;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

public enum WorkspaceTaskOwnerRole {
    ADMIN,
    CLIENT;

    public static WorkspaceTaskOwnerRole parse(String value) {
        if (value == null || value.isBlank()) {
            return ADMIN;
        }

        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported task owner: " + value);
        }
    }

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }
}
