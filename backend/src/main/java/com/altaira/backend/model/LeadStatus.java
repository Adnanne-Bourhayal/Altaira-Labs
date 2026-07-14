package com.altaira.backend.model;

import com.altaira.backend.exception.InvalidLeadStatusException;

import java.util.Arrays;
import java.util.Locale;

public enum LeadStatus {
    NEW("new"),
    CONTACTED("contacted"),
    CLOSED("closed");

    private final String value;

    LeadStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static LeadStatus parse(String status) {
        if (status == null || status.isBlank()) {
            throw new InvalidLeadStatusException("Lead status is required");
        }

        String normalizedStatus = status.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(leadStatus -> leadStatus.value.equals(normalizedStatus))
                .findFirst()
                .orElseThrow(() -> new InvalidLeadStatusException("Invalid lead status"));
    }
}
