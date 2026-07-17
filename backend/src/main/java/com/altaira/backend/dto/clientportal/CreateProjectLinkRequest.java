package com.altaira.backend.dto.clientportal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateProjectLinkRequest {

    @NotBlank
    @Size(max = 500)
    private String url;

    @Size(max = 160)
    private String label;

    @Size(max = 80)
    private String assetType;

    @Size(max = 2000)
    private String notes;

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
