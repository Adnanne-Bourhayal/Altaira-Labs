package com.altaira.backend.integration.github;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitHubAppPropertiesTests {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(GitHubAppProperties.class);

    @Test
    void defaultsAllowApplicationToStartWithoutGitHubVariables() {
        contextRunner.run(context -> {
            GitHubAppProperties properties = context.getBean(GitHubAppProperties.class);
            assertFalse(properties.enabled());
            assertFalse(properties.provisioningEnabled());
            assertTrue(properties.dryRun());
            assertEquals("Altaira-Labs", properties.org());
            assertFalse(properties.appConfigured());
            assertFalse(properties.installationIdConfigured());
        });
    }

    @Test
    void readsGitHubVariablesFromSpringProperties() {
        contextRunner
                .withPropertyValues(
                        "altaira.github.app.enabled=true",
                        "altaira.github.provisioning.enabled=false",
                        "altaira.github.dry-run=true",
                        "altaira.github.org=Altaira-Labs",
                        "altaira.github.api-base-url=https://api.github.test",
                        "altaira.github.app.id=4339634",
                        "altaira.github.app.client-id=Iv23liG1o7dXGqZDEdd8",
                        "altaira.github.app.installation-id=147629095",
                        "altaira.github.app.private-key-base64=test-key",
                        "altaira.github.app.webhook-secret=test-webhook-secret"
                )
                .run(context -> {
                    GitHubAppProperties properties = context.getBean(GitHubAppProperties.class);
                    assertTrue(properties.enabled());
                    assertFalse(properties.provisioningEnabled());
                    assertTrue(properties.dryRun());
                    assertEquals("Altaira-Labs", properties.org());
                    assertEquals("4339634", properties.appId());
                    assertEquals("Iv23liG1o7dXGqZDEdd8", properties.appClientId());
                    assertEquals("147629095", properties.installationId());
                    assertTrue(properties.appConfigured());
                    assertTrue(properties.installationIdConfigured());
                });
    }
}
