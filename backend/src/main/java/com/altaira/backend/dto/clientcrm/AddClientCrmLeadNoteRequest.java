package com.altaira.backend.dto.clientcrm;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AddClientCrmLeadNoteRequest {

    @NotBlank(message = "Note content is required")
    @Size(max = 1200, message = "Note content must be at most 1200 characters")
    private String content;

    private Boolean visibleToClient;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Boolean getVisibleToClient() { return visibleToClient; }
    public void setVisibleToClient(Boolean visibleToClient) { this.visibleToClient = visibleToClient; }
}
