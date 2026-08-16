package com.altaira.backend.integration.github;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

@Service
public class GitHubInstallationTokenService implements GitHubInstallationTokenProvider {

    private final GitHubAppProperties properties;
    private final GitHubAppJwtService jwtService;
    private final GitHubApiClient apiClient;

    public GitHubInstallationTokenService(
            GitHubAppProperties properties,
            GitHubAppJwtService jwtService,
            GitHubApiClient apiClient
    ) {
        this.properties = properties;
        this.jwtService = jwtService;
        this.apiClient = apiClient;
    }

    @Override
    public String createInstallationToken() {
        if (!properties.canAttemptConnection()) {
            throw GitHubIntegrationException.missingConfiguration(
                    "GitHub App credentials and installation ID are required."
            );
        }

        String jwt = jwtService.createJwt(properties);
        JsonNode response = apiClient.post(
                properties.apiUri("/app/installations/" + properties.installationId() + "/access_tokens"),
                jwt,
                null
        );
        String token = response.path("token").asText("");
        if (token.isBlank()) {
            throw GitHubIntegrationException.safe("GitHub installation token response did not include a token.");
        }
        return token;
    }
}
