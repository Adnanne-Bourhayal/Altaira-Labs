package com.altaira.backend.dto.lead;

public class LeadIntakeResponse {
    private LeadResponse lead;
    private LeadAssessmentResponse assessment;

    public LeadIntakeResponse() {}

    public LeadIntakeResponse(LeadResponse lead, LeadAssessmentResponse assessment) {
        this.lead = lead;
        this.assessment = assessment;
    }

    public LeadResponse getLead() { return lead; }
    public void setLead(LeadResponse lead) { this.lead = lead; }
    public LeadAssessmentResponse getAssessment() { return assessment; }
    public void setAssessment(LeadAssessmentResponse assessment) { this.assessment = assessment; }
}
