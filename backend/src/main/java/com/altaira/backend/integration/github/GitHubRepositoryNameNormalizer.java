package com.altaira.backend.integration.github;

import java.text.Normalizer;
import java.util.Locale;

public final class GitHubRepositoryNameNormalizer {

    private GitHubRepositoryNameNormalizer() {}

    public static String normalize(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]+", "-")
                .replaceAll("^[._-]+|[._-]+$", "")
                .replaceAll("-{2,}", "-");

        if (normalized.isBlank()) {
            return "altaira-client-workspace";
        }
        if (normalized.length() > 80) {
            return normalized.substring(0, 80).replaceAll("[._-]+$", "");
        }
        return normalized;
    }
}
