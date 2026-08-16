package com.altaira.backend.exception;

import java.util.UUID;

public class LeadNotFoundException extends RuntimeException {

    public LeadNotFoundException(UUID id) {
        super("Lead not found: " + id);
    }
}
