package com.altaira.backend.integration.github;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;

@Component
public class GitHubAppProperties {

    private final boolean enabled;
    private final boolean provisioningEnabled;
    private final boolean dryRun;
    private final String org;
    private final String apiBaseUrl;
    private final String appId;
    private final String appClientId;
    private final String installationId;
    private final String privateKeyBase64;
    private final String webhookSecret;

    public GitHubAppProperties(
            @Value("${altaira.github.app.enabled:false}") boolean enabled,
            @Value("${altaira.github.provisioning.enabled:false}") boolean provisioningEnabled,
            @Value("${altaira.github.dry-run:true}") boolean dryRun,
            @Value("${altaira.github.org:Altaira-Labs}") String org,
            @Value("${altaira.github.api-base-url:https://api.github.com}") String apiBaseUrl,
            @Value("${altaira.github.app.id:}") String appId,
            @Value("${altaira.github.app.client-id:}") String appClientId,
            @Value("${altaira.github.app.installation-id:}") String installationId,
            @Value("${altaira.github.app.private-key-base64:}") String privateKeyBase64,
            @Value("${altaira.github.app.webhook-secret:}") String webhookSecret
    ) {
        this.enabled = enabled;
        this.provisioningEnabled = provisioningEnabled;
        this.dryRun = dryRun;
        this.org = trimOrDefault(org, "Altaira-Labs");
        this.apiBaseUrl = trimOrDefault(apiBaseUrl, "https://api.github.com");
        this.appId = trim(appId);
        this.appClientId = trim(appClientId);
        this.installationId = trim(installationId);
        this.privateKeyBase64 = trim(privateKeyBase64);
        this.webhookSecret = trim(webhookSecret);
    }

    public boolean enabled() {
        return enabled;
    }

    public boolean provisioningEnabled() {
        return provisioningEnabled;
    }

    public boolean dryRun() {
        return dryRun;
    }

    public String org() {
        return org;
    }

    public String appId() {
        return appId;
    }

    public String appClientId() {
        return appClientId;
    }

    public String installationId() {
        return installationId;
    }

    public String webhookSecretConfiguredValue() {
        return webhookSecret;
    }

    String privateKeyBase64ConfiguredValue() {
        return privateKeyBase64;
    }

    public boolean appConfigured() {
        return !appId.isBlank() && !privateKeyBase64.isBlank();
    }

    public boolean installationIdConfigured() {
        return !installationId.isBlank();
    }

    public URI apiUri(String path) {
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        try {
            return new URI(apiBaseUrl.replaceAll("/+$", "") + normalizedPath);
        } catch (URISyntaxException ex) {
            throw GitHubIntegrationException.safe("GitHub API base URL is invalid. Check GITHUB_API_BASE_URL.");
        }
    }

    public boolean canAttemptConnection() {
        return enabled && appConfigured() && installationIdConfigured();
    }

    public boolean canMutateResources() {
        return enabled && provisioningEnabled && !dryRun;
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimOrDefault(String value, String defaultValue) {
        String trimmed = trim(value);
        return trimmed.isBlank() ? defaultValue : trimmed;
    }
}
