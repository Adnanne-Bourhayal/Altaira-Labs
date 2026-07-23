package com.altaira.backend.model;

public enum ProvisioningPlanStatus {
    DRAFT("draft"),
    AWAITING_APPROVAL("awaiting_approval"),
    APPROVED("approved"),
    PROVISIONED("provisioned"),
    PARTIALLY_COMPLETED("partially_completed"),
    FAILED("failed");

    private final String value;

    ProvisioningPlanStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static ProvisioningPlanStatus parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Provisioning plan status is required");
        }
        for (ProvisioningPlanStatus status : values()) {
            if (status.value.equalsIgnoreCase(raw.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unsupported provisioning plan status: " + raw);
    }
}
