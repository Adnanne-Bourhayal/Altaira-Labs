package com.altaira.backend.integration.github;

public class GitHubIntegrationException extends RuntimeException {

    private static final int MAX_SAFE_MESSAGE_LENGTH = 500;

    private final String safeMessage;
    private final Integer statusCode;

    private GitHubIntegrationException(String safeMessage, Integer statusCode) {
        super(safeMessage);
        this.safeMessage = safeMessage;
        this.statusCode = statusCode;
    }

    public static GitHubIntegrationException safe(String safeMessage) {
        return new GitHubIntegrationException(safeMessage, null);
    }

    public static GitHubIntegrationException missingConfiguration(String safeMessage) {
        return new GitHubIntegrationException(safeMessage, null);
    }

    public static GitHubIntegrationException githubApi(int statusCode, String message) {
        return new GitHubIntegrationException("GitHub API returned " + statusCode + ": " + sanitize(message), statusCode);
    }

    public static GitHubIntegrationException connectionFailed() {
        return new GitHubIntegrationException("GitHub API connection failed.", null);
    }

    public static GitHubIntegrationException connectionInterrupted() {
        return new GitHubIntegrationException("GitHub API connection was interrupted.", null);
    }

    public String safeMessage() {
        return safeMessage;
    }

    public boolean hasStatusCode(int expectedStatusCode) {
        return statusCode != null && statusCode == expectedStatusCode;
    }

    private static String sanitize(String message) {
        if (message == null || message.isBlank()) {
            return "request failed";
        }
        String sanitized = message
                .replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("(?i)Bearer\\s+[^\\s,;]+", "Bearer [REDACTED]")
                .replaceAll("(?i)(gh[pousr]_|github_pat_)[A-Za-z0-9_]+", "[REDACTED]")
                .trim();
        return sanitized.substring(0, Math.min(sanitized.length(), MAX_SAFE_MESSAGE_LENGTH));
    }
}
