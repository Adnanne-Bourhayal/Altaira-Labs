package com.altaira.backend.integration.jira;

public class JiraIntegrationException extends RuntimeException {

    private static final int MAX_SAFE_MESSAGE_LENGTH = 500;
    private final String safeMessage;
    private final Integer statusCode;

    private JiraIntegrationException(String safeMessage, Integer statusCode) {
        super(safeMessage);
        this.safeMessage = safeMessage;
        this.statusCode = statusCode;
    }

    public static JiraIntegrationException safe(String message) {
        return new JiraIntegrationException(sanitize(message), null);
    }

    public static JiraIntegrationException api(int statusCode, String message) {
        return new JiraIntegrationException(
                "Jira API returned " + statusCode + ": " + sanitize(message),
                statusCode
        );
    }

    public static JiraIntegrationException connectionFailed() {
        return new JiraIntegrationException("Jira API connection failed.", null);
    }

    public static JiraIntegrationException connectionInterrupted() {
        return new JiraIntegrationException("Jira API connection was interrupted.", null);
    }

    public String safeMessage() {
        return safeMessage;
    }

    public boolean hasStatusCode(int expected) {
        return statusCode != null && statusCode == expected;
    }

    private static String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "request failed";
        }
        String sanitized = value
                .replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("(?i)Basic\\s+[^\\s,;]+", "Basic [REDACTED]")
                .replaceAll("(?i)Bearer\\s+[^\\s,;]+", "Bearer [REDACTED]")
                .replaceAll("(?i)(api[_ -]?token|token|password)\\s*[:=]\\s*[^\\s,;]+", "$1=[REDACTED]")
                .trim();
        return sanitized.substring(0, Math.min(sanitized.length(), MAX_SAFE_MESSAGE_LENGTH));
    }
}
