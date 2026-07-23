package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum LeadIntakeFormKey {
    GENERAL("general"),
    WEB_SEO("web_seo"),
    BOOKING("booking"),
    CRM("crm"),
    AUTOMATION("automation"),
    DASHBOARD("dashboard");

    private final String value;

    LeadIntakeFormKey(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static LeadIntakeFormKey parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Lead intake form key is required");
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(formKey -> formKey.value.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported lead intake form key"));
    }
}
