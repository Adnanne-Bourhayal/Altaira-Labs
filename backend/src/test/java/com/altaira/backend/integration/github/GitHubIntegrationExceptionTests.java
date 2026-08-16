package com.altaira.backend.integration.github;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubIntegrationExceptionTests {

    @Test
    void redactsCredentialsAndBoundsProviderErrors() {
        String repeatedText = "x".repeat(600);

        GitHubIntegrationException exception = GitHubIntegrationException.githubApi(
                401,
                "Bearer secret-provider-token github_pat_secretprovidercredential " + repeatedText
        );

        assertThat(exception.safeMessage())
                .doesNotContain("secret-provider-token")
                .doesNotContain("secretprovidercredential")
                .contains("Bearer [REDACTED]")
                .hasSizeLessThanOrEqualTo(525);
    }
}
