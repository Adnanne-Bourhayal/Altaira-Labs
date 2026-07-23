package com.altaira.backend.provisioning;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class RequirementSet {

    public static final String DATABASE = "requires_database";
    public static final String BACKEND = "requires_backend";
    public static final String FRONTEND = "requires_frontend";
    public static final String STATIC_SITE = "requires_static_site";
    public static final String AUTH = "requires_auth";
    public static final String CMS = "requires_cms";
    public static final String PAYMENTS = "requires_payments";
    public static final String BOOKING = "requires_booking";
    public static final String CRM = "requires_crm";
    public static final String CALENDAR = "requires_calendar";
    public static final String AUTOMATION = "requires_automation";
    public static final String FILE_STORAGE = "requires_file_storage";
    public static final String DASHBOARD = "requires_dashboard";
    public static final String REALTIME = "requires_realtime";
    public static final String DATA_MIGRATION = "requires_data_migration";
    public static final String TRAINING = "requires_training";
    public static final String EXTERNAL_INTEGRATIONS = "requires_external_integrations";

    private static final List<String> ORDERED_KEYS = List.of(
            DATABASE,
            BACKEND,
            FRONTEND,
            STATIC_SITE,
            AUTH,
            CMS,
            PAYMENTS,
            BOOKING,
            CRM,
            CALENDAR,
            AUTOMATION,
            FILE_STORAGE,
            DASHBOARD,
            REALTIME,
            DATA_MIGRATION,
            TRAINING,
            EXTERNAL_INTEGRATIONS
    );

    private final Map<String, Boolean> values = new LinkedHashMap<>();

    public RequirementSet() {
        ORDERED_KEYS.forEach(key -> values.put(key, false));
    }

    public void enable(String key) {
        requireKnownKey(key);
        values.put(key, true);
    }

    public void disable(String key) {
        requireKnownKey(key);
        values.put(key, false);
    }

    public boolean has(String key) {
        requireKnownKey(key);
        return values.get(key);
    }

    public Map<String, Boolean> asMap() {
        return Map.copyOf(values);
    }

    private void requireKnownKey(String key) {
        if (!values.containsKey(key)) {
            throw new IllegalArgumentException("Unknown provisioning requirement: " + key);
        }
    }
}
