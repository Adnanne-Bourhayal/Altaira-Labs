package com.altaira.backend.provisioning;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ProvisioningRequirementNormalizerV2Tests {

    private final ProvisioningRequirementNormalizer normalizer = new ProvisioningRequirementNormalizer();

    @Test
    void multipleBookingLocationsSelectCustomTechnicalDependencies() {
        RequirementSet requirements = normalizer.normalize(
                "booking",
                Map.of(
                        "bookingType", "Appointments",
                        "resources", "Professionals",
                        "slotDuration", "60 minutes",
                        "locationCount", "3"
                ),
                List.of("booking")
        );

        assertTrue(requirements.has(RequirementSet.BACKEND));
        assertTrue(requirements.has(RequirementSet.DATABASE));
    }

    @Test
    void highCriticalityAutomationSelectsCustomTechnicalDependencies() {
        RequirementSet requirements = normalizer.normalize(
                "automation",
                Map.of("channels", "email", "criticality", "high"),
                List.of("automation")
        );

        assertTrue(requirements.has(RequirementSet.BACKEND));
        assertTrue(requirements.has(RequirementSet.DATABASE));
    }

    @Test
    void dashboardViewerAndFinancialSignalsRequireAuthentication() {
        RequirementSet requirements = normalizer.normalize(
                "dashboard",
                Map.of(
                        "updateFrequency", "weekly",
                        "viewerType", "mixed",
                        "financialData", "yes"
                ),
                List.of("dashboard")
        );

        assertTrue(requirements.has(RequirementSet.AUTH));
    }
}
