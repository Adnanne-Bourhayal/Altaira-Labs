package com.altaira.backend.dto.clientportal;

import jakarta.validation.constraints.Size;

public class ReviewProjectAssetRequest {

    @Size(max = 1000, message = "Feedback must be at most 1000 characters")
    private String feedback;

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}
