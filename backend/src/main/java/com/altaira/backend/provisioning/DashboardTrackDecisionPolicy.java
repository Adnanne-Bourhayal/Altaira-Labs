package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.List;

public final class DashboardTrackDecisionPolicy implements TrackDecisionPolicy {

    private final ProvisioningToolCatalog tools;

    public DashboardTrackDecisionPolicy(ProvisioningToolCatalog tools) {
        this.tools = tools;
    }

    @Override
    public ProvisioningTrack track() {
        return ProvisioningTrack.DASHBOARD;
    }

    @Override
    public boolean supports(ProvisioningDecisionContext context) {
        return context.recommends(track())
                || "dashboard".equals(context.formKey())
                || context.requirements().has(RequirementSet.DASHBOARD);
    }

    @Override
    public TrackDecision decide(ProvisioningDecisionContext context) {
        boolean custom = context.requirements().has(RequirementSet.REALTIME);
        ProvisioningRoute route = custom
                ? ProvisioningRoute.PROVISION_DASHBOARD_CUSTOM
                : ProvisioningRoute.PROVISION_DASHBOARD_BI;
        List<ProvisioningDecision.ToolDecision> selected = selectedTools(context, custom);

        return new TrackDecision(
                track(),
                route,
                custom ? "DASHBOARD-CUSTOM-REALTIME" : "DASHBOARD-BI-STANDARD",
                List.of(
                        "frequency=" + context.value("updateFrequency", "reporting"),
                        "sources=" + context.value("dataSources"),
                        "auth=" + context.requirements().has(RequirementSet.AUTH)
                ),
                custom
                        ? "Realtime operational state requires a custom authenticated dashboard."
                        : "Periodic reporting and KPI analysis fit a managed BI platform.",
                context.isGeneral() ? 0.82 : 0.95,
                true,
                custom ? AutomationLevel.A3 : AutomationLevel.A2,
                selected,
                planItems(context, selected),
                manualSteps(context, custom),
                List.of(
                        "Data quality and metric definition can invalidate reporting.",
                        "Access control, tenant leakage and license limits require review.",
                        "Source consistency and read-only access must be validated for sensitive data.",
                        "OAuth quota and provider limits can interrupt refreshes.",
                        "Realtime latency, availability and load require custom testing.",
                        "Exported data, permissions and financial data require explicit controls."
                )
        );
    }

    private List<ProvisioningDecision.ToolDecision> selectedTools(
            ProvisioningDecisionContext context,
            boolean custom
    ) {
        List<ProvisioningDecision.ToolDecision> result = new ArrayList<>();
        if (custom) {
            result.add(tools.select("AUTH", true, "Protected operational views."));
            result.add(tools.select("GITHUB", true, "Custom dashboard source."));
            result.add(tools.select("NEON", true, "Realtime dashboard state."));
            result.add(tools.select("REALTIME", true, "Realtime update channel."));
            result.add(tools.select("RENDER", true, "Dashboard API runtime."));
            result.add(tools.select("VERCEL", true, "Dashboard frontend deployment."));
            return result;
        }
        if (context.requirements().has(RequirementSet.AUTH)) {
            result.add(tools.select("AUTH", true, "Protected BI access."));
        }
        result.add(tools.select("BI", true, "Managed reporting and visualization."));
        result.add(tools.exclude("GITHUB", "Managed BI does not require a custom repository."));
        result.add(tools.exclude("RENDER", "Managed BI does not require a new backend."));
        result.add(tools.exclude("NEON", "Managed BI reads approved sources."));
        result.add(tools.exclude("VERCEL", "Managed BI supplies the dashboard surface."));
        return result;
    }

    private List<ProvisioningDecision.ManualStepDecision> manualSteps(
            ProvisioningDecisionContext context,
            boolean custom
    ) {
        List<ProvisioningDecision.ManualStepDecision> result = new ArrayList<>();
        if (custom) {
            result.add(tools.manual("ARCHITECTURE_REVIEW", "Review realtime architecture", "Realtime boundaries need technical approval.", true));
            result.add(tools.manual("SECRETS", "Provide source secrets", "Credentials require a secure channel.", true));
            result.add(tools.manual("LOAD_TESTING", "Approve load test", "Concurrency needs validation.", true));
            result.add(tools.manual("OBSERVABILITY", "Approve monitoring", "Operational health must be visible.", true));
            appendDataGovernanceReviews(result, context);
            return result;
        }
        result.add(tools.manual("KPI_APPROVAL", "Approve KPI definitions", "Business metrics need an owner.", true));
        if (context.isGeneral()) {
            return result;
        }
        String source = context.value("dataSources");
        if (context.requirements().has(RequirementSet.DATA_MIGRATION)) {
            result.add(tools.manual("DATA_CLEANING", "Clean source data", "Spreadsheet data requires validation.", true));
        }
        if (source.contains("crm and spreadsheet")) {
            result.add(tools.manual("SOURCE_MAPPING", "Map reporting sources", "Join rules need validation.", true));
        }
        if (source.contains("postgresql")) {
            result.add(tools.manual("READ_ONLY_ACCESS", "Create read-only access", "BI must not mutate clinical data.", true));
            result.add(tools.manual("PRIVACY", "Review sensitive reporting", "Clinical metrics require privacy review.", true));
        }
        if (source.contains("google analytics")) {
            result.add(tools.manual("GOOGLE_OAUTH", "Authorize Google properties", "Property ownership requires OAuth.", true));
        }
        if (context.equalsAny("updateFrequency", "monthly")) {
            result.add(tools.manual("EXPORT_FORMAT", "Approve export format", "Monthly reporting output needs agreement.", true));
        }
        if (context.contains("users", "finance and operations")) {
            result.add(tools.manual("ROLE_MAPPING", "Map dashboard roles", "Department access must be explicit.", true));
            result.add(tools.manual("RLS_REVIEW", "Review row-level access", "Financial data needs tenant isolation.", true));
        } else if (context.requirements().has(RequirementSet.AUTH)) {
            result.add(tools.manual("ROLE_MAPPING", "Map dashboard roles", "Viewer access needs approval.", true));
            result.add(tools.manual("EMBED_REVIEW", "Review embedded access", "Embedding must preserve access control.", true));
        }
        if (!context.requirements().has(RequirementSet.AUTH)) {
            result.add(tools.manual("BI_ACCOUNT", "Confirm BI account", "The client must own the BI account.", true));
        }
        appendDataGovernanceReviews(result, context);
        return result;
    }

    private void appendDataGovernanceReviews(
            List<ProvisioningDecision.ManualStepDecision> result,
            ProvisioningDecisionContext context
    ) {
        if (context.yes("financialData", "sensitiveData")) {
            result.add(tools.manual("DATA_GOVERNANCE", "Approve dashboard data access", "Sensitive or financial metrics need explicit viewers and retention rules.", true));
        }
        if (context.yes("exportRequired")) {
            result.add(tools.manual("EXPORT_FORMAT", "Approve export delivery", "Recipients, format and delivery schedule must be agreed.", true));
        }
    }

    private List<ProvisioningDecision.PlanItemDecision> planItems(
            ProvisioningDecisionContext context,
            List<ProvisioningDecision.ToolDecision> selected
    ) {
        return selected.stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(tool -> tools.item(tool.key(), "TRACK_RESOURCE", context.businessName() + " dashboard", "PREPARE", tool.reason()))
                .toList();
    }
}
