package com.altaira.backend.integration.github;

import com.altaira.backend.dto.github.GitHubProvisioningDryRunRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitHubProvisioningServiceTests {

    @Test
    void dryRunNeverExecutesGitHubWriteSteps() {
        GitHubAppProperties properties = new GitHubAppProperties(
                true,
                true,
                true,
                "Altaira-Labs",
                "https://api.github.com",
                "4339634",
                "Iv23liG1o7dXGqZDEdd8",
                "147629095",
                "configured-key-placeholder",
                ""
        );
        GitHubProvisioningService service = new GitHubProvisioningService(properties);
        GitHubProvisioningDryRunRequest request = new GitHubProvisioningDryRunRequest();
        request.setClientName("Clínica Ágora");
        request.setProjectName("CRM MVP");
        request.setPrivateRepository(true);
        request.setServiceKeys(List.of("crm", "automation"));

        var plan = service.dryRun(request);

        assertTrue(plan.dryRun());
        assertFalse(plan.executionAllowed());
        assertEquals("clinica-agora-crm-mvp", plan.normalizedName());
        assertEquals("Altaira-Labs/clinica-agora-crm-mvp", plan.repoToCreate());
        assertEquals("private", plan.visibility());
        plan.preparedSteps().values().forEach(step -> {
            assertFalse(step.executed());
            assertEquals("GITHUB_DRY_RUN=true; no GitHub write operation is allowed.", step.reason());
        });
    }
}
