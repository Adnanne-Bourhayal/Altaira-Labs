package com.altaira.backend.dto.clientcrm;

import jakarta.validation.constraints.Size;

public class CreateClientCrmWebhookTokenRequest {

    @Size(max = 120, message = "Label must be at most 120 characters")
    private String label;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
