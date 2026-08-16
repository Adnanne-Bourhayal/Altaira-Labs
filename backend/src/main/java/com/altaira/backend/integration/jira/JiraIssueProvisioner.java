package com.altaira.backend.integration.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Creates or reuses a Jira task by its Altaira idempotency label and validates that
 * the returned issue belongs to the configured project before persisting its link.
 */
@Service
public class JiraIssueProvisioner {

    private static final Pattern SAFE_LABEL = Pattern.compile("[a-z0-9][a-z0-9-]{0,199}");

    private final JiraProperties properties;
    private final JiraApiClient apiClient;
    private final ObjectMapper objectMapper;

    public JiraIssueProvisioner(
            JiraProperties properties,
            JiraApiClient apiClient,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.apiClient = apiClient;
        this.objectMapper = objectMapper;
    }

    public JiraIssueProvisioningResult ensureTask(
            String summary,
            String description,
            List<String> labels,
            String idempotencyLabel
    ) {
        requireExecutionGate();
        String safeSummary = requireText(summary, "Jira issue summary is required.", 255);
        String safeDescription = requireText(description, "Jira issue description is required.", 2000);
        String safeIdempotencyLabel = validateLabel(idempotencyLabel);
        Set<String> safeLabels = new LinkedHashSet<>();
        safeLabels.add("altaira");
        if (labels != null) {
            labels.stream().map(this::validateLabel).forEach(safeLabels::add);
        }
        safeLabels.add(safeIdempotencyLabel);

        JsonNode existing = findExistingIssue(safeIdempotencyLabel);
        if (existing != null) {
            return validateIssue(existing, safeSummary, false, true);
        }

        ObjectNode request = objectMapper.createObjectNode();
        ObjectNode fields = request.putObject("fields");
        fields.putObject("project").put("key", properties.projectKey());
        fields.put("summary", safeSummary);
        fields.putObject("issuetype").put("name", properties.issueType());
        ArrayNode labelArray = fields.putArray("labels");
        safeLabels.forEach(labelArray::add);
        fields.set("description", adfDescription(safeDescription));

        JsonNode created = apiClient.post(properties.apiUri("/rest/api/3/issue"), request);
        return validateIssue(created, safeSummary, true, false);
    }

    private JsonNode findExistingIssue(String idempotencyLabel) {
        ObjectNode search = objectMapper.createObjectNode();
        search.put(
                "jql",
                "project = \"" + properties.projectKey() + "\" AND labels = \"" + idempotencyLabel + "\""
        );
        search.put("maxResults", 2);
        search.putArray("fields").add("summary").add("labels").add("project");
        JsonNode result = apiClient.post(properties.apiUri("/rest/api/3/search/jql"), search);
        JsonNode issues = result.path("issues");
        if (!issues.isArray() || issues.isEmpty()) {
            return null;
        }
        if (issues.size() > 1) {
            throw JiraIntegrationException.safe(
                    "Multiple Jira issues share the same Altaira idempotency label; manual review is required."
            );
        }
        return issues.get(0);
    }

    private JiraIssueProvisioningResult validateIssue(
            JsonNode issue,
            String expectedSummary,
            boolean created,
            boolean reused
    ) {
        String id = issue.path("id").asText("");
        String key = issue.path("key").asText("");
        String returnedSummary = issue.path("fields").path("summary").asText(expectedSummary);
        String returnedProject = issue.path("fields").path("project").path("key")
                .asText(key.contains("-") ? key.substring(0, key.indexOf('-')) : "");
        if (id.isBlank()
                || !key.startsWith(properties.projectKey() + "-")
                || !properties.projectKey().equals(returnedProject)
                || !expectedSummary.equals(returnedSummary)) {
            throw JiraIntegrationException.safe("Jira issue response did not match the approved project task target.");
        }
        String issueUrl = properties.apiUri("/browse/" + key).toString();
        return new JiraIssueProvisioningResult(created, reused, id, key, issueUrl);
    }

    private ObjectNode adfDescription(String description) {
        ObjectNode document = objectMapper.createObjectNode();
        document.put("type", "doc");
        document.put("version", 1);
        ObjectNode paragraph = objectMapper.createObjectNode();
        paragraph.put("type", "paragraph");
        paragraph.putArray("content").addObject().put("type", "text").put("text", description);
        document.putArray("content").add(paragraph);
        return document;
    }

    private void requireExecutionGate() {
        if (!properties.canMutateResources()) {
            throw JiraIntegrationException.safe(
                    "Jira issue creation is blocked unless integration and provisioning are enabled and dry-run is disabled."
            );
        }
        if (!properties.canAttemptConnection()) {
            throw JiraIntegrationException.safe("Jira credentials or target project are incomplete.");
        }
    }

    private String validateLabel(String value) {
        String label = value == null ? "" : value.trim().toLowerCase();
        if (!SAFE_LABEL.matcher(label).matches()) {
            throw JiraIntegrationException.safe("Jira label is not an approved normalized label.");
        }
        return label;
    }

    private String requireText(String value, String error, int maxLength) {
        String text = value == null ? "" : value.trim();
        if (text.isBlank()) {
            throw JiraIntegrationException.safe(error);
        }
        return text.substring(0, Math.min(text.length(), maxLength));
    }
}
