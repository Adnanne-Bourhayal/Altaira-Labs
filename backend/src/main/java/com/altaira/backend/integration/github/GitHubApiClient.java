package com.altaira.backend.integration.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class GitHubApiClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public GitHubApiClient(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    GitHubApiClient(ObjectMapper objectMapper, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public JsonNode get(URI uri, String bearerToken) {
        return exchange("GET", uri, bearerToken, null);
    }

    public JsonNode post(URI uri, String bearerToken, JsonNode body) {
        return exchange("POST", uri, bearerToken, body == null ? "{}" : body.toString());
    }

    private JsonNode exchange(String method, URI uri, String bearerToken, String body) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/vnd.github+json")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("Authorization", "Bearer " + bearerToken);

        if ("POST".equals(method)) {
            builder.header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body == null ? "{}" : body));
        } else {
            builder.GET();
        }

        try {
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode json = response.body() == null || response.body().isBlank()
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(response.body());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw GitHubIntegrationException.githubApi(response.statusCode(), safeMessage(json));
            }

            return json;
        } catch (IOException ex) {
            throw GitHubIntegrationException.connectionFailed();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw GitHubIntegrationException.connectionInterrupted();
        }
    }

    private String safeMessage(JsonNode json) {
        JsonNode message = json == null ? null : json.get("message");
        if (message == null || message.asText("").isBlank()) {
            return "GitHub API request failed.";
        }
        return message.asText();
    }
}
