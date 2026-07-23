package com.altaira.backend.integration.github;

public class GitHubIntegrationException extends RuntimeException {

    private final String safeMessage;

    private GitHubIntegrationException(String safeMessage) {
        super(safeMessage);
        this.safeMessage = safeMessage;
    }

    public static GitHubIntegrationException safe(String safeMessage) {
        return new GitHubIntegrationException(safeMessage);
    }

    public static GitHubIntegrationException missingConfiguration(String safeMessage) {
        return new GitHubIntegrationException(safeMessage);
    }

    public static GitHubIntegrationException githubApi(int statusCode, String message) {
        return new GitHubIntegrationException("GitHub API returned " + statusCode + ": " + sanitize(message));
    }

    public static GitHubIntegrationException connectionFailed() {
        return new GitHubIntegrationException("GitHub API connection failed.");
    }

    public static GitHubIntegrationException connectionInterrupted() {
        return new GitHubIntegrationException("GitHub API connection was interrupted.");
    }

    public String safeMessage() {
        return safeMessage;
    }

    private static String sanitize(String message) {
        if (message == null || message.isBlank()) {
            return "request failed";
        }
        return message.replaceAll("[\\r\\n\\t]+", " ").trim();
    }
}
