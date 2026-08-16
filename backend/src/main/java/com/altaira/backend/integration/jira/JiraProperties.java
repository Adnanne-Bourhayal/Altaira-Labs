package com.altaira.backend.integration.jira;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.regex.Pattern;

@Component
public class JiraProperties {

    private static final Pattern PROJECT_KEY = Pattern.compile("[A-Z][A-Z0-9_]{1,19}");

    private final boolean enabled;
    private final boolean provisioningEnabled;
    private final boolean dryRun;
    private final String baseUrl;
    private final String email;
    private final String apiToken;
    private final String projectKey;
    private final String issueType;

    public JiraProperties(
            @Value("${altaira.jira.enabled:false}") boolean enabled,
            @Value("${altaira.jira.provisioning.enabled:false}") boolean provisioningEnabled,
            @Value("${altaira.jira.dry-run:true}") boolean dryRun,
            @Value("${altaira.jira.base-url:}") String baseUrl,
            @Value("${altaira.jira.email:}") String email,
            @Value("${altaira.jira.api-token:}") String apiToken,
            @Value("${altaira.jira.project-key:}") String projectKey,
            @Value("${altaira.jira.issue-type:Task}") String issueType
    ) {
        this.enabled = enabled;
        this.provisioningEnabled = provisioningEnabled;
        this.dryRun = dryRun;
        this.baseUrl = trim(baseUrl).replaceAll("/+$", "");
        this.email = trim(email);
        this.apiToken = trim(apiToken);
        this.projectKey = trim(projectKey).toUpperCase();
        this.issueType = trim(issueType).isBlank() ? "Task" : trim(issueType);
    }

    public boolean canMutateResources() {
        return enabled && provisioningEnabled && !dryRun;
    }

    public boolean canAttemptConnection() {
        return enabled
                && !baseUrl.isBlank()
                && !email.isBlank()
                && !apiToken.isBlank()
                && PROJECT_KEY.matcher(projectKey).matches();
    }

    public URI apiUri(String path) {
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        try {
            URI uri = new URI(baseUrl + normalizedPath);
            boolean secure = "https".equalsIgnoreCase(uri.getScheme());
            boolean localTest = "http".equalsIgnoreCase(uri.getScheme())
                    && ("127.0.0.1".equals(uri.getHost()) || "localhost".equalsIgnoreCase(uri.getHost()));
            if ((!secure && !localTest) || uri.getUserInfo() != null || uri.getHost() == null) {
                throw JiraIntegrationException.safe("Jira base URL is not an approved HTTPS endpoint.");
            }
            return uri;
        } catch (URISyntaxException exception) {
            throw JiraIntegrationException.safe("Jira base URL is invalid. Check JIRA_BASE_URL.");
        }
    }

    public String email() {
        return email;
    }

    String apiTokenConfiguredValue() {
        return apiToken;
    }

    public String projectKey() {
        return projectKey;
    }

    public String issueType() {
        return issueType;
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
