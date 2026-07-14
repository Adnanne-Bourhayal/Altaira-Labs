package com.altaira.backend.exception;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;

    public ResourceNotFoundException(String resourceName, UUID id) {
        super(resourceName + " not found: " + id);
        this.resourceName = resourceName;
    }

    public String getResourceName() {
        return resourceName;
    }
}
