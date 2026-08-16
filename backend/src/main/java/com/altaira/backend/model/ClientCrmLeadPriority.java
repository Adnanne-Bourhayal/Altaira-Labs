package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum ClientCrmLeadPriority {
    LOW("low"),
    NORMAL("normal"),
    HIGH("high"),
    URGENT("urgent");

    private final String value;

    ClientCrmLeadPriority(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ClientCrmLeadPriority parse(String priority) {
        if (priority == null || priority.isBlank()) {
            return NORMAL;
        }

        String normalized = priority.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(leadPriority -> leadPriority.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid client CRM lead priority"));
    }
}
