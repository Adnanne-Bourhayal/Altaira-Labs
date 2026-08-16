package com.altaira.backend.integration.jira;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JiraIntegrationExceptionTests {

    @Test
    void redactsCredentialsAndControlCharactersFromProviderErrors() {
        JiraIntegrationException exception = JiraIntegrationException.safe(
                "failed\nBasic dXNlcjpzZWNyZXQ= token=super-secret password:also-secret"
        );

        assertThat(exception.safeMessage())
                .doesNotContain("dXNlcjpzZWNyZXQ=")
                .doesNotContain("super-secret")
                .doesNotContain("also-secret")
                .doesNotContain("\n")
                .contains("[REDACTED]");
    }
}
