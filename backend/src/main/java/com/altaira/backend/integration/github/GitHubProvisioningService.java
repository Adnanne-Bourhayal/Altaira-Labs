package com.altaira.backend.integration.github;

import com.altaira.backend.dto.github.GitHubProvisioningDryRunRequest;
import com.altaira.backend.dto.github.GitHubProvisioningPlanResponse;
import com.altaira.backend.dto.github.GitHubProvisioningStepResult;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class GitHubProvisioningService {

    private final GitHubAppProperties properties;

    public GitHubProvisioningService(GitHubAppProperties properties) {
        this.properties = properties;
    }

    public GitHubProvisioningPlanResponse dryRun(GitHubProvisioningDryRunRequest request) {
        String projectName = trimToDefault(request == null ? null : request.getProjectName(), "Altaira client workspace");
        String clientName = trimToDefault(request == null ? null : request.getClientName(), projectName);
        String normalizedName = normalizeRepositoryName(clientName + " " + projectName);
        boolean privateRepository = request == null || request.getPrivateRepository() == null || request.getPrivateRepository();
        String description = trimToDefault(
                request == null ? null : request.getDescription(),
                "Prepared workspace repository for " + clientName + ". Created only after explicit provisioning approval."
        );
        List<String> serviceKeys = request == null || request.getServiceKeys() == null || request.getServiceKeys().isEmpty()
                ? List.of("lead-capture", "lead-management")
                : request.getServiceKeys().stream()
                        .filter(value -> value != null && !value.isBlank())
                        .map(value -> value.trim().toLowerCase(Locale.ROOT))
                        .distinct()
                        .toList();

        List<String> files = List.of(
                "README.md",
                ".gitignore",
                ".env.example",
                "docs/intake-summary.md",
                "docs/provisioning-checklist.md"
        );
        List<String> labels = List.of("p0", "p1", "client-setup", "provisioning", "manual-review");
        List<String> issues = List.of(
                "Confirm client technical intake",
                "Prepare environment variable checklist",
                "Confirm deployment target and domain ownership",
                "Prepare manual handoff checklist",
                "Review service scope: " + String.join(", ", serviceKeys)
        );
        List<String> risks = List.of(
                "Dry-run only: no GitHub repository, files, labels or issues are created.",
                "Provisioning must stay disabled until a manual validation run approves the target repository.",
                "Secrets must be added through GitHub/Render/Vercel secret stores, never committed to the repository.",
                "Domain, OAuth, payment and production deployment steps still require manual confirmation."
        );
        List<String> manualSteps = List.of(
                "Validate normalized repository name with the client/project owner.",
                "Confirm whether the repository should be private.",
                "Confirm GitHub App permissions are reduced to the minimum required before live provisioning.",
                "Run one controlled demo repository creation only after this dry-run is approved."
        );

        Map<String, GitHubProvisioningStepResult> preparedSteps = new LinkedHashMap<>();
        GitHubProvisioningPlanResponse plan = new GitHubProvisioningPlanResponse(
                true,
                properties.enabled(),
                properties.provisioningEnabled(),
                properties.canMutateResources(),
                properties.org(),
                properties.org() + "/" + normalizedName,
                normalizedName,
                privateRepository ? "private" : "public",
                description,
                files,
                labels,
                issues,
                risks,
                manualSteps,
                preparedSteps
        );

        preparedSteps.put("createRepository", createRepository(plan));
        preparedSteps.put("createInitialFiles", createInitialFiles(plan));
        preparedSteps.put("createLabels", createLabels(plan));
        preparedSteps.put("createIssues", createIssues(plan));
        preparedSteps.put("createPullRequest", createPullRequest(plan));

        return plan;
    }

    public GitHubProvisioningStepResult createRepository(GitHubProvisioningPlanResponse plan) {
        return guardedStep("createRepository", "Would create repository " + plan.repoToCreate());
    }

    public GitHubProvisioningStepResult createInitialFiles(GitHubProvisioningPlanResponse plan) {
        return guardedStep("createInitialFiles", "Would create " + plan.initialFilesProposed().size() + " starter files");
    }

    public GitHubProvisioningStepResult createLabels(GitHubProvisioningPlanResponse plan) {
        return guardedStep("createLabels", "Would create " + plan.labelsProposed().size() + " labels");
    }

    public GitHubProvisioningStepResult createIssues(GitHubProvisioningPlanResponse plan) {
        return guardedStep("createIssues", "Would create " + plan.issuesProposed().size() + " issues");
    }

    public GitHubProvisioningStepResult createPullRequest(GitHubProvisioningPlanResponse plan) {
        return guardedStep("createPullRequest", "Would open a setup pull request if branch-based initialization is selected");
    }

    private GitHubProvisioningStepResult guardedStep(String step, String action) {
        if (!properties.enabled()) {
            return new GitHubProvisioningStepResult(step, false, action, "GitHub App integration is disabled.");
        }
        if (!properties.provisioningEnabled()) {
            return new GitHubProvisioningStepResult(step, false, action, "GitHub provisioning is disabled.");
        }
        if (properties.dryRun()) {
            return new GitHubProvisioningStepResult(step, false, action, "GITHUB_DRY_RUN=true; no GitHub write operation is allowed.");
        }
        return new GitHubProvisioningStepResult(step, false, action, "Live GitHub write operation is intentionally not implemented in this safe backend block.");
    }

    private String normalizeRepositoryName(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]+", "-")
                .replaceAll("^[._-]+|[._-]+$", "")
                .replaceAll("-{2,}", "-");

        if (normalized.isBlank()) {
            return "altaira-client-workspace";
        }
        if (normalized.length() > 80) {
            return normalized.substring(0, 80).replaceAll("[._-]+$", "");
        }
        return normalized;
    }

    private String trimToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
