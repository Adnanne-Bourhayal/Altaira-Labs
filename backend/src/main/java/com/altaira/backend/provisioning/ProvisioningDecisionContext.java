package com.altaira.backend.provisioning;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public record ProvisioningDecisionContext(
        RequirementSet requirements,
        String formKey,
        Map<String, Object> responses,
        List<String> recommendedServices,
        String businessName
) {
    public ProvisioningDecisionContext {
        formKey = normalize(formKey);
        responses = responses == null ? Map.of() : Map.copyOf(responses);
        recommendedServices = recommendedServices == null
                ? List.of()
                : recommendedServices.stream().map(ProvisioningDecisionContext::normalize).toList();
        businessName = businessName == null || businessName.isBlank() ? "Client" : businessName.trim();
    }

    public boolean isGeneral() {
        return "general".equals(formKey);
    }

    public boolean recommends(ProvisioningTrack track) {
        return recommendedServices.contains(track.serviceKey());
    }

    public String value(String... keys) {
        for (String key : keys) {
            Object raw = responses.get(key);
            if (raw instanceof Collection<?> values) {
                String joined = values.stream()
                        .map(String::valueOf)
                        .map(ProvisioningDecisionContext::normalize)
                        .filter(value -> !value.isBlank())
                        .reduce((left, right) -> left + "," + right)
                        .orElse("");
                if (!joined.isBlank()) {
                    return joined;
                }
            } else if (raw != null) {
                String value = normalize(String.valueOf(raw));
                if (!value.isBlank()) {
                    return value;
                }
            }
        }
        return "";
    }

    public boolean equalsAny(String key, String... candidates) {
        String actual = value(key);
        for (String candidate : candidates) {
            if (actual.equals(normalize(candidate))) {
                return true;
            }
        }
        return false;
    }

    public boolean contains(String key, String... fragments) {
        String actual = value(key);
        for (String fragment : fragments) {
            if (actual.contains(normalize(fragment))) {
                return true;
            }
        }
        return false;
    }

    public boolean yes(String... keys) {
        for (String key : keys) {
            if (equalsAny(key, "yes", "true", "required", "enabled")) {
                return true;
            }
        }
        return false;
    }

    public int integer(String key) {
        String digits = value(key).replaceAll("[^0-9]", "");
        return digits.isBlank() ? 0 : Integer.parseInt(digits);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
