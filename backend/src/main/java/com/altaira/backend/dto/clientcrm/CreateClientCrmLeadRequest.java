package com.altaira.backend.dto.clientcrm;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class CreateClientCrmLeadRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 160, message = "Full name must be at most 160 characters")
    private String fullName;

    @Email(message = "Email must be valid")
    @Size(max = 180, message = "Email must be at most 180 characters")
    private String email;

    @Size(max = 80, message = "Phone must be at most 80 characters")
    private String phone;

    @Size(max = 80, message = "Source must be at most 80 characters")
    private String source;

    @Size(max = 40, message = "Priority must be at most 40 characters")
    private String priority;

    private Map<String, String> sectorFields;

    @Size(max = 1200, message = "Initial note must be at most 1200 characters")
    private String initialNote;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Map<String, String> getSectorFields() { return sectorFields; }
    public void setSectorFields(Map<String, String> sectorFields) { this.sectorFields = sectorFields; }

    public String getInitialNote() { return initialNote; }
    public void setInitialNote(String initialNote) { this.initialNote = initialNote; }
}
