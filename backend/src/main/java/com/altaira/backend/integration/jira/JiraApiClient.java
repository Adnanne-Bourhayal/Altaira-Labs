package com.altaira.backend.integration.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Component
public class JiraApiClient {

    private final JiraProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public JiraApiClient(JiraProperties properties, ObjectMapper objectMapper) {
        this(properties, objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    JiraApiClient(JiraProperties properties, ObjectMapper objectMapper, HttpClient httpClient) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public JsonNode post(URI uri, JsonNode body) {
        String credential = properties.email() + ":" + properties.apiTokenConfiguredValue();
        String authorization = Base64.getEncoder().encodeToString(credential.getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + authorization)
                .POST(HttpRequest.BodyPublishers.ofString(body == null ? "{}" : body.toString()))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = response.body() == null || response.body().isBlank()
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw JiraIntegrationException.api(response.statusCode(), safeMessage(json));
            }
            return json;
        } catch (IOException exception) {
            throw JiraIntegrationException.connectionFailed();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw JiraIntegrationException.connectionInterrupted();
        }
    }

    private String safeMessage(JsonNode json) {
        if (json == null) {
            return "Jira API request failed.";
        }
        JsonNode messages = json.path("errorMessages");
        if (messages.isArray() && !messages.isEmpty()) {
            return messages.get(0).asText("Jira API request failed.");
        }
        JsonNode errors = json.path("errors");
        if (errors.isObject() && errors.fields().hasNext()) {
            return errors.fields().next().getValue().asText("Jira API request failed.");
        }
        return json.path("message").asText("Jira API request failed.");
    }
}
