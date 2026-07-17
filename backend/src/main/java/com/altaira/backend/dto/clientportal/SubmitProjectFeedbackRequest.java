package com.altaira.backend.dto.clientportal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitProjectFeedbackRequest {

    @NotBlank(message = "Feedback is required")
    @Size(max = 2000, message = "Feedback must be at most 2000 characters")
    private String feedback;

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}
