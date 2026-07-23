package com.altaira.backend.dto.lead;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class LeadConversionRequest {

    @NotEmpty(message = "At least one service is required")
    @Size(max = 5, message = "At most five services can be assigned")
    private List<String> serviceKeys;

    @AssertTrue(message = "Lead conversion must be explicitly confirmed")
    private boolean confirmed;

    @Size(max = 1000, message = "Conversion notes must be at most 1000 characters")
    private String notes;

    public List<String> getServiceKeys() { return serviceKeys; }
    public void setServiceKeys(List<String> serviceKeys) { this.serviceKeys = serviceKeys; }
    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
