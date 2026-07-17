package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum ClientCrmLeadStatus {
    NEW_LEAD("new_lead"),
    CONTACTED("contacted"),
    APPOINTMENT_SCHEDULED("appointment_scheduled"),
    PROPOSAL_SENT("proposal_sent"),
    WON("won"),
    LOST("lost");

    private final String value;

    ClientCrmLeadStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ClientCrmLeadStatus parse(String status) {
        if (status == null || status.isBlank()) {
            return NEW_LEAD;
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(leadStatus -> leadStatus.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid client CRM lead status"));
    }
}
