package com.altaira.backend.dto.clientinvitation;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class CreateClientInvitationRequest {
    @Email(message = "Invitation email must be valid")
    @Size(max = 160, message = "Invitation email must be at most 160 characters")
    private String email;

    @Size(max = 40, message = "Invitation role must be at most 40 characters")
    private String role = "client_user";

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
