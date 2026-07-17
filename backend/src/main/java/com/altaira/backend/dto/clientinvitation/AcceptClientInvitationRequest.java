package com.altaira.backend.dto.clientinvitation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AcceptClientInvitationRequest {
    @NotBlank(message = "Invitation token is required")
    private String token;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 200, message = "Password must be between 8 and 200 characters")
    private String password;

    @NotBlank(message = "Password confirmation is required")
    @Size(min = 8, max = 200, message = "Password confirmation must be between 8 and 200 characters")
    private String confirmPassword;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}
