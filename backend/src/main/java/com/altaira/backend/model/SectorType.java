package com.altaira.backend.model;

import java.util.Arrays;
import java.util.Locale;

public enum SectorType {
    CLINICS("clinics"),
    RESTAURANTS("restaurants"),
    CAR_DEALERS("car_dealers"),
    CUSTOM("custom");

    private final String value;

    SectorType(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static SectorType parse(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return CUSTOM;
        }

        String normalized = rawValue.trim().toLowerCase(Locale.ROOT)
                .replace("-", "_")
                .replace(" ", "_");

        if ("clinic".equals(normalized) || "clinica".equals(normalized) || "clinicas".equals(normalized)) {
            return CLINICS;
        }

        if ("restaurant".equals(normalized) || "restaurante".equals(normalized) || "restaurantes".equals(normalized)) {
            return RESTAURANTS;
        }

        if ("car_dealer".equals(normalized) || "cardealer".equals(normalized) || "concesionario".equals(normalized) || "concesionarios".equals(normalized)) {
            return CAR_DEALERS;
        }

        if ("a_medida".equals(normalized) || "custom_business".equals(normalized) || "specialty".equals(normalized)) {
            return CUSTOM;
        }

        return Arrays.stream(values())
                .filter(sectorType -> sectorType.value.equals(normalized))
                .findFirst()
                .orElse(CUSTOM);
    }
}
