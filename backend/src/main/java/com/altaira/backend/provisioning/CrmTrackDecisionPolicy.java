package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.List;

public final class CrmTrackDecisionPolicy implements TrackDecisionPolicy {

    private final ProvisioningToolCatalog tools;

    public CrmTrackDecisionPolicy(ProvisioningToolCatalog tools) {
        this.tools = tools;
    }

    @Override
    public ProvisioningTrack track() {
        return ProvisioningTrack.CRM;
    }

    @Override
    public boolean supports(ProvisioningDecisionContext context) {
        return context.recommends(track())
                || "crm".equals(context.formKey());
    }

    @Override
    public TrackDecision decide(ProvisioningDecisionContext context) {
        boolean external = context.equalsAny("currentLeadProcess", "existing_crm");
        ProvisioningRoute route = external
                ? ProvisioningRoute.PROVISION_CRM_EXTERNAL
                : ProvisioningRoute.PROVISION_CRM_ALTAIRA;
        boolean assisted = external
                || context.requirements().has(RequirementSet.DATA_MIGRATION)
                || context.requirements().has(RequirementSet.EXTERNAL_INTEGRATIONS)
                || context.requirements().has(RequirementSet.AUTOMATION);
        List<ProvisioningDecision.ToolDecision> selected = selectedTools(context, external);

        return new TrackDecision(
                track(),
                route,
                external ? "CRM-EXTERNAL-REUSE" : "CRM-ALTAIRA-STANDARD",
                List.of(
                        "leadProcess=" + context.value("currentLeadProcess", "leadProcess"),
                        "migration=" + context.requirements().has(RequirementSet.DATA_MIGRATION),
                        "automation=" + context.requirements().has(RequirementSet.AUTOMATION)
                ),
                external
                        ? "An existing CRM should be configured and integrated rather than rebuilt."
                        : "The required lead workflow fits the existing tenant-scoped Altaira CRM.",
                context.isGeneral() ? 0.84 : 0.96,
                external || context.requirements().has(RequirementSet.DATA_MIGRATION),
                assisted ? AutomationLevel.A2 : AutomationLevel.A3,
                selected,
                planItems(context, selected),
                manualSteps(context, external),
                List.of(
                        "CRM permissions and training require owner validation.",
                        "Privacy, sensitive data and tenant isolation controls must match the sector.",
                        "Imports can create duplicates or invalid records.",
                        "Form field mapping, spam and duplicate leads require validation.",
                        "Task ownership and permissions must be explicit.",
                        "Automated follow-up can create duplicate messages and hit rate limits.",
                        "External CRM license, API limits and migration quality remain provider dependencies.",
                        "Confidential documents and shared links require explicit access; unauthorized automation must be blocked."
                )
        );
    }

    private List<ProvisioningDecision.ToolDecision> selectedTools(
            ProvisioningDecisionContext context,
            boolean external
    ) {
        List<ProvisioningDecision.ToolDecision> result = new ArrayList<>();
        if (external) {
            result.add(tools.select("DRIVE", true, "Migration and training resources."));
            result.add(tools.select("EXTERNAL_CRM", true, "Existing CRM configuration and integration."));
            return result;
        }

        result.add(tools.select("ALTAIRA", true, "Existing private CRM workspace."));
        result.add(tools.select("AUTH", true, "Tenant-scoped CRM access."));
        if (!context.isGeneral()) {
            result.add(tools.select("DRIVE", true, "Field maps and training resources."));
            result.add(tools.select("JIRA", true, "Configuration and migration backlog."));
            result.add(tools.select("NEON", true, "Existing tenant-scoped persistence."));
        } else if (context.requirements().has(RequirementSet.FILE_STORAGE)) {
            result.add(tools.select("DRIVE", true, "Confidential discovery documents."));
        }
        if (context.contains("leadSources", "multiple website forms")) {
            result.add(tools.select("WEBHOOK", true, "Multiple forms require mapped intake endpoints."));
        }
        if (context.contains("requiredFields", "owner", "next action", "deadline")) {
            result.add(tools.select("TASKS", true, "CRM follow-up requires task ownership."));
        }
        if (context.requirements().has(RequirementSet.AUTOMATION) && !context.isGeneral()) {
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Automated CRM follow-up."));
            result.add(tools.select("RESEND", true, "Follow-up messages."));
        }
        return result;
    }

    private List<ProvisioningDecision.ManualStepDecision> manualSteps(
            ProvisioningDecisionContext context,
            boolean external
    ) {
        List<ProvisioningDecision.ManualStepDecision> result = new ArrayList<>();
        if (external) {
            result.add(tools.manual("CRM_ACCOUNT", "Confirm CRM account owner", "The client must own the CRM account.", true));
            result.add(tools.manual("OAUTH_CONSENT", "Authorize CRM access", "OAuth requires the owner.", true));
            result.add(tools.manual("MIGRATION", "Validate migration", "Existing records require mapping.", true));
            result.add(tools.manual("TRAINING", "Schedule CRM training", "Adoption remains human-led.", true));
            if (context.yes("sensitiveData")) {
                result.add(tools.manual("SENSITIVE_DATA_REVIEW", "Review sensitive CRM fields", "Field access and retention require explicit approval.", true));
            }
            if (context.equalsAny("keepOrReplace", "unknown")) {
                result.add(tools.manual("CRM_DECISION", "Confirm CRM direction", "The existing CRM must be kept, reconfigured or replaced before provisioning.", true));
            }
            return result;
        }
        result.add(tools.manual("PRIVACY", "Review CRM privacy", "Lead data needs lawful access boundaries.", true));
        result.add(tools.manual("FIELDS", "Approve fields and pipeline", "Operational terminology needs owner approval.", true));
        result.add(tools.manual("TRAINING", "Schedule CRM training", "Adoption remains human-led.", true));
        if (context.contains("requiredFields", "contact and service interest only") || context.yes("sensitiveData")) {
            result.add(tools.manual("SENSITIVE_DATA_REVIEW", "Review sensitive fields", "Only necessary fields should be stored.", true));
        }
        if (context.contains("leadSources", "multiple website forms")) {
            result.add(tools.manual("FORM_MAPPING", "Map source forms", "Field and source mapping requires validation.", true));
        }
        if (context.requirements().has(RequirementSet.DATA_MIGRATION)) {
            result.add(tools.manual("MIGRATION", "Map import data", "Imports require duplicate and quality review.", true));
        }
        if (context.contains("requiredFields", "owner", "next action", "deadline")) {
            result.add(tools.manual("TASK_OWNERSHIP", "Approve task ownership", "Responsibilities need an owner.", true));
        }
        if (context.requirements().has(RequirementSet.AUTOMATION)) {
            result.add(tools.manual("AUTOMATION_APPROVAL", "Approve CRM automation", "Automated messages require approval.", true));
        }
        if (context.isGeneral() && context.contains("primaryGoal", "lead_management")) {
            result.add(tools.manual("FIELD_MAPPING", "Approve lead field mapping", "Dealer lead fields require review.", true));
        }
        if (context.isGeneral() && context.requirements().has(RequirementSet.FILE_STORAGE)) {
            result.add(tools.manual("DOCUMENT_PERMISSIONS", "Approve document permissions", "Confidential files need explicit access.", true));
            result.add(tools.manual("RETENTION_POLICY", "Approve retention policy", "Document retention must be defined.", true));
        }
        return result;
    }

    private List<ProvisioningDecision.PlanItemDecision> planItems(
            ProvisioningDecisionContext context,
            List<ProvisioningDecision.ToolDecision> selected
    ) {
        return selected.stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(tool -> tools.item(tool.key(), "TRACK_RESOURCE", context.businessName() + " CRM", "PREPARE", tool.reason()))
                .toList();
    }
}
