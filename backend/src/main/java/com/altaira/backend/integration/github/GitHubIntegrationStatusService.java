package com.altaira.backend.integration.github;

import com.altaira.backend.dto.github.GitHubIntegrationStatusResponse;
import com.altaira.backend.dto.github.GitHubRepositoriesVisible;
import com.altaira.backend.dto.github.GitHubRepositorySummary;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GitHubIntegrationStatusService {

    private final GitHubAppProperties properties;
    private final GitHubAppJwtService jwtService;
    private final GitHubApiClient apiClient;

    public GitHubIntegrationStatusService(
            GitHubAppProperties properties,
            GitHubAppJwtService jwtService,
            GitHubApiClient apiClient
    ) {
        this.properties = properties;
        this.jwtService = jwtService;
        this.apiClient = apiClient;
    }

    public GitHubIntegrationStatusResponse getStatus() {
        List<String> errors = new ArrayList<>();
        boolean installationReachable = false;
        Map<String, String> permissions = new LinkedHashMap<>();
        List<GitHubRepositorySummary> repositories = new ArrayList<>();

        if (!properties.enabled()) {
            return response(false, permissions, repositories, errors);
        }

        if (!properties.appConfigured()) {
            errors.add("GitHub App is enabled but GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY_BASE64 is missing.");
            return response(false, permissions, repositories, errors);
        }

        if (!properties.installationIdConfigured()) {
            errors.add("GitHub App is enabled but GITHUB_APP_INSTALLATION_ID is missing.");
            return response(false, permissions, repositories, errors);
        }

        try {
            String jwt = jwtService.createJwt(properties);
            JsonNode installation = apiClient.get(properties.apiUri("/app/installations/" + properties.installationId()), jwt);
            installationReachable = true;
            permissions.putAll(readPermissions(installation.get("permissions")));

            JsonNode tokenResponse = apiClient.post(
                    properties.apiUri("/app/installations/" + properties.installationId() + "/access_tokens"),
                    jwt,
                    null
            );
            permissions.putAll(readPermissions(tokenResponse.get("permissions")));
            String installationToken = tokenResponse.path("token").asText("");
            if (installationToken.isBlank()) {
                errors.add("GitHub installation token response did not include a token.");
                return response(installationReachable, permissions, repositories, errors);
            }

            JsonNode org = apiClient.get(properties.apiUri("/orgs/" + properties.org()), installationToken);
            if (!properties.org().equalsIgnoreCase(org.path("login").asText(""))) {
                errors.add("GitHub organization check returned an unexpected organization.");
            }

            JsonNode repositoriesResponse = apiClient.get(properties.apiUri("/installation/repositories?per_page=100"), installationToken);
            repositories.addAll(readRepositories(repositoriesResponse.path("repositories")));
        } catch (GitHubIntegrationException ex) {
            errors.add(ex.safeMessage());
        } catch (RuntimeException ex) {
            errors.add("GitHub integration status could not be checked safely.");
        }

        return response(installationReachable, permissions, repositories, errors);
    }

    private GitHubIntegrationStatusResponse response(
            boolean installationReachable,
            Map<String, String> permissions,
            List<GitHubRepositorySummary> repositories,
            List<String> errors
    ) {
        return new GitHubIntegrationStatusResponse(
                properties.enabled(),
                properties.provisioningEnabled(),
                properties.dryRun(),
                properties.org(),
                properties.appConfigured(),
                properties.installationIdConfigured(),
                installationReachable,
                new GitHubRepositoriesVisible(repositories.size(), repositories),
                permissions,
                errors
        );
    }

    private Map<String, String> readPermissions(JsonNode permissionsNode) {
        Map<String, String> permissions = new LinkedHashMap<>();
        if (permissionsNode instanceof ObjectNode objectNode) {
            objectNode.fields().forEachRemaining(entry -> permissions.put(entry.getKey(), entry.getValue().asText("")));
        }
        return permissions;
    }

    private List<GitHubRepositorySummary> readRepositories(JsonNode repositoriesNode) {
        List<GitHubRepositorySummary> repositories = new ArrayList<>();
        if (repositoriesNode == null || !repositoriesNode.isArray()) {
            return repositories;
        }

        for (JsonNode repository : repositoriesNode) {
            JsonNode owner = repository.get("owner");
            String ownerLogin = owner == null ? "" : owner.path("login").asText("");
            if (!properties.org().equalsIgnoreCase(ownerLogin)) {
                continue;
            }
            repositories.add(new GitHubRepositorySummary(
                    repository.path("name").asText(""),
                    repository.path("full_name").asText(""),
                    repository.path("private").asBoolean(false),
                    repository.path("default_branch").asText("")
            ));
        }
        return repositories;
    }
}
