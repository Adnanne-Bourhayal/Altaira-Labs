package com.altaira.backend.dto.lead;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class CreateAdminLeadIntakeRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must be at most 120 characters")
    private String fullName;

    @NotBlank(message = "Business name is required")
    @Size(max = 160, message = "Business name must be at most 160 characters")
    private String businessName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 180, message = "Email must be at most 180 characters")
    private String email;

    @Size(max = 50, message = "Phone must be at most 50 characters")
    private String phone;

    @Size(max = 120, message = "Industry must be at most 120 characters")
    private String industry;

    @Size(max = 2000, message = "Goals must be at most 2000 characters")
    private String goals;

    @NotBlank(message = "Form key is required")
    @Size(max = 40, message = "Form key must be at most 40 characters")
    private String formKey;

    @NotNull(message = "Assessment responses are required")
    private Map<String, Object> responses;

    @Min(value = 1, message = "Assessment schema version must be at least 1")
    @Max(value = 2, message = "Assessment schema version is not supported")
    private Integer schemaVersion;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }
    public String getFormKey() { return formKey; }
    public void setFormKey(String formKey) { this.formKey = formKey; }
    public Map<String, Object> getResponses() { return responses; }
    public void setResponses(Map<String, Object> responses) { this.responses = responses; }
    public Integer getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(Integer schemaVersion) { this.schemaVersion = schemaVersion; }
}
