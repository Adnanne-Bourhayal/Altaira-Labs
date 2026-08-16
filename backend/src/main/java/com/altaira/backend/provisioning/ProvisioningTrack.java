package com.altaira.backend.provisioning;

public enum ProvisioningTrack {
    WEB("web_seo"),
    BOOKING("booking"),
    CRM("crm"),
    AUTOMATION("automation"),
    DASHBOARD("dashboard");

    private final String serviceKey;

    ProvisioningTrack(String serviceKey) {
        this.serviceKey = serviceKey;
    }

    public String serviceKey() {
        return serviceKey;
    }
}
