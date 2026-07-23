package com.altaira.backend.service;

import com.altaira.backend.model.LeadIntakeFormKey;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LeadIntakeSchemaV2ValidatorTests {

    private final LeadIntakeSchemaV2Validator validator = new LeadIntakeSchemaV2Validator();

    @Test
    void acceptsCompleteGeneralDiagnosticWithCommercialAndInternalSignals() {
        Map<String, Object> responses = new LinkedHashMap<>();
        responses.put("primaryGoal", "bookings");
        responses.put("onlinePresence", "outdated");
        responses.put("bookingProcess", "calls_messages");
        responses.put("leadProcess", "spreadsheet");
        responses.put("repetitiveWork", "high");
        responses.put("reporting", "manual");
        responses.put("budgetBand", "5000_10000");
        responses.put("targetTimeline", "1_3_months");
        responses.put("commercialStage", "ready_for_proposal");
        responses.put("sensitiveData", "yes");
        responses.put("serviceSelectionConfirmation", "needs_client_confirmation");

        assertDoesNotThrow(() -> validator.validate(LeadIntakeFormKey.GENERAL, responses));
    }

    @Test
    void rejectsIncompleteV2Diagnostic() {
        Map<String, Object> responses = Map.of("primaryGoal", "bookings");

        assertThrows(
                IllegalArgumentException.class,
                () -> validator.validate(LeadIntakeFormKey.GENERAL, responses)
        );
    }

    @Test
    void requiresDirectionWhenAnExistingCrmIsSelected() {
        Map<String, Object> responses = new LinkedHashMap<>();
        responses.put("currentLeadProcess", "existing_crm");
        responses.put("leadSources", "Website");
        responses.put("requiredFields", "Name and service interest");
        responses.put("importRequired", "no");

        assertThrows(
                IllegalArgumentException.class,
                () -> validator.validate(LeadIntakeFormKey.CRM, responses)
        );

        responses.put("keepOrReplace", "keep_integrate");
        assertDoesNotThrow(() -> validator.validate(LeadIntakeFormKey.CRM, responses));
    }

    @Test
    void rejectsNestedObjectsSoCredentialsCannotBeHiddenInStructuredPayloads() {
        Map<String, Object> responses = new LinkedHashMap<>();
        responses.put("currentProcess", "Send lead confirmation");
        responses.put("trigger", "New lead");
        responses.put("expectedAction", "Send email");
        responses.put("failureHandling", "Keep pending for retry");
        responses.put("credentials", Map.of("token", "must-not-be-stored"));

        assertThrows(
                IllegalArgumentException.class,
                () -> validator.validate(LeadIntakeFormKey.AUTOMATION, responses)
        );
    }
}
