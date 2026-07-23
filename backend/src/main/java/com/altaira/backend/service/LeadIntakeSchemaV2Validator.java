package com.altaira.backend.service;

import com.altaira.backend.model.LeadIntakeFormKey;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Set;

@Component
public class LeadIntakeSchemaV2Validator {

    private static final int MAX_TEXT_LENGTH = 4_000;
    private static final int MAX_COLLECTION_ITEMS = 30;

    private static final Set<String> YES_NO_UNKNOWN = Set.of("yes", "no", "unknown");

    public void validate(LeadIntakeFormKey formKey, Map<String, Object> responses) {
        validateSafeValueShapes(responses);
        validateSharedOptions(responses);

        switch (formKey) {
            case GENERAL -> validateGeneral(responses);
            case WEB_SEO -> validateWeb(responses);
            case BOOKING -> validateBooking(responses);
            case CRM -> validateCrm(responses);
            case AUTOMATION -> validateAutomation(responses);
            case DASHBOARD -> validateDashboard(responses);
        }
    }

    private void validateGeneral(Map<String, Object> responses) {
        require(responses, "primaryGoal", "onlinePresence", "bookingProcess", "leadProcess", "repetitiveWork", "reporting");
        option(responses, "primaryGoal", Set.of("online_presence", "bookings", "lead_management", "automation", "visibility"));
        option(responses, "onlinePresence", Set.of("none", "basic", "outdated", "working"));
        option(responses, "bookingProcess", Set.of("not_applicable", "calls_messages", "spreadsheet_calendar", "booking_tool"));
        option(responses, "leadProcess", Set.of("messages_email", "spreadsheet", "crm"));
        option(responses, "repetitiveWork", Set.of("low", "medium", "high"));
        option(responses, "reporting", Set.of("none", "manual", "dashboard"));
    }

    private void validateWeb(Map<String, Object> responses) {
        require(responses, "websiteState", "solutionShape", "contentManagement", "authentication", "dataPersistence",
                "payments", "externalIntegrations", "coreOffer", "targetLocations", "contentReady");
        option(responses, "websiteState", Set.of("none", "replace", "improve", "landing"));
        option(responses, "solutionShape", Set.of("informative", "custom_app", "ecommerce", "unknown"));
        yesNoUnknown(responses, "contentManagement", "authentication", "dataPersistence", "payments", "contentReady");
        option(responses, "externalIntegrations", Set.of("none", "standard", "custom", "unknown"));
        optionIfPresent(responses, "languages", Set.of("single", "multilingual", "unknown"));
        optionIfPresent(responses, "platformPreference", Set.of("managed_builder", "wordpress", "shopify", "custom", "unknown"));
        optionIfPresent(responses, "maintenanceOwner", Set.of("client", "altaira", "shared", "unknown"));
    }

    private void validateBooking(Map<String, Object> responses) {
        require(responses, "bookingType", "currentBookingProcess", "openingHours", "resources", "slotDuration", "depositRequired");
        option(responses, "currentBookingProcess", Set.of("calls_messages", "calendar", "existing_tool"));
        yesNoUnknown(responses, "depositRequired");
        integerIfPresent(responses, "resourceCount", 1, 500);
        integerIfPresent(responses, "locationCount", 1, 100);
        optionIfPresent(responses, "calendarProvider", Set.of("google", "microsoft", "calcom", "other", "none"));
    }

    private void validateCrm(Map<String, Object> responses) {
        require(responses, "currentLeadProcess", "leadSources", "requiredFields", "importRequired");
        option(responses, "currentLeadProcess", Set.of("messages_email", "spreadsheet", "existing_crm"));
        yesNoUnknown(responses, "importRequired");
        integerIfPresent(responses, "userCount", 1, 500);
        if ("existing_crm".equals(value(responses, "currentLeadProcess"))) {
            require(responses, "keepOrReplace");
        }
        optionIfPresent(responses, "keepOrReplace", Set.of("keep_integrate", "reconfigure", "replace", "unknown"));
    }

    private void validateAutomation(Map<String, Object> responses) {
        require(responses, "currentProcess", "trigger", "expectedAction", "failureHandling");
        yesNoUnknownIfPresent(responses, "approvalWorkflow");
        optionIfPresent(responses, "criticality", Set.of("low", "medium", "high", "unknown"));
        integerIfPresent(responses, "monthlyVolume", 0, 10_000_000);
    }

    private void validateDashboard(Map<String, Object> responses) {
        require(responses, "decisions", "kpis", "dataSources", "updateFrequency", "users", "currentReporting");
        option(responses, "updateFrequency", Set.of("realtime", "daily", "weekly", "monthly"));
        option(responses, "currentReporting", Set.of("none", "spreadsheets", "manual_reports", "existing_dashboard"));
        optionIfPresent(responses, "viewerType", Set.of("owner", "internal_team", "clients", "mixed"));
        yesNoUnknownIfPresent(responses, "financialData", "exportRequired");
    }

    private void validateSharedOptions(Map<String, Object> responses) {
        optionIfPresent(responses, "budgetBand", Set.of("under_2500", "2500_5000", "5000_10000", "10000_plus", "unknown"));
        optionIfPresent(responses, "targetTimeline", Set.of("under_1_month", "1_3_months", "3_6_months", "flexible"));
        optionIfPresent(responses, "commercialStage", Set.of("exploring", "needs_approval", "ready_for_proposal"));
        yesNoUnknownIfPresent(responses, "sensitiveData");
        optionIfPresent(responses, "serviceSelectionConfirmation", Set.of("confirmed", "needs_discovery", "needs_client_confirmation"));
    }

    private void validateSafeValueShapes(Map<String, Object> responses) {
        responses.forEach((key, raw) -> {
            if (raw == null) {
                return;
            }
            if (raw instanceof Map<?, ?>) {
                throw new IllegalArgumentException("Assessment field '" + key + "' cannot contain nested objects");
            }
            if (raw instanceof Collection<?> collection) {
                if (collection.size() > MAX_COLLECTION_ITEMS) {
                    throw new IllegalArgumentException("Assessment field '" + key + "' contains too many values");
                }
                collection.forEach(value -> validateScalarLength(key, value));
                return;
            }
            validateScalarLength(key, raw);
        });
    }

    private void validateScalarLength(String key, Object raw) {
        if (!(raw instanceof String || raw instanceof Number || raw instanceof Boolean)) {
            throw new IllegalArgumentException("Assessment field '" + key + "' has an unsupported value type");
        }
        if (String.valueOf(raw).length() > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("Assessment field '" + key + "' is too long");
        }
    }

    private void require(Map<String, Object> responses, String... keys) {
        for (String key : keys) {
            if (value(responses, key).isBlank()) {
                throw new IllegalArgumentException("Assessment field '" + key + "' is required for schema v2");
            }
        }
    }

    private void yesNoUnknown(Map<String, Object> responses, String... keys) {
        for (String key : keys) {
            option(responses, key, YES_NO_UNKNOWN);
        }
    }

    private void yesNoUnknownIfPresent(Map<String, Object> responses, String... keys) {
        for (String key : keys) {
            optionIfPresent(responses, key, YES_NO_UNKNOWN);
        }
    }

    private void option(Map<String, Object> responses, String key, Set<String> allowed) {
        String actual = value(responses, key);
        if (!allowed.contains(actual)) {
            throw new IllegalArgumentException("Assessment field '" + key + "' has an unsupported value");
        }
    }

    private void optionIfPresent(Map<String, Object> responses, String key, Set<String> allowed) {
        String actual = value(responses, key);
        if (!actual.isBlank() && !allowed.contains(actual)) {
            throw new IllegalArgumentException("Assessment field '" + key + "' has an unsupported value");
        }
    }

    private void integerIfPresent(Map<String, Object> responses, String key, int min, int max) {
        String actual = value(responses, key);
        if (actual.isBlank()) {
            return;
        }
        try {
            int parsed = Integer.parseInt(actual);
            if (parsed < min || parsed > max) {
                throw new IllegalArgumentException("Assessment field '" + key + "' is outside the supported range");
            }
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Assessment field '" + key + "' must be a whole number");
        }
    }

    private String value(Map<String, Object> responses, String key) {
        Object raw = responses.get(key);
        return raw == null ? "" : String.valueOf(raw).trim().toLowerCase();
    }
}
