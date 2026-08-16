package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.List;

public final class AutomationTrackDecisionPolicy implements TrackDecisionPolicy {

    private final ProvisioningToolCatalog tools;

    public AutomationTrackDecisionPolicy(ProvisioningToolCatalog tools) {
        this.tools = tools;
    }

    @Override
    public ProvisioningTrack track() {
        return ProvisioningTrack.AUTOMATION;
    }

    @Override
    public boolean supports(ProvisioningDecisionContext context) {
        return context.recommends(track())
                || "automation".equals(context.formKey())
                || context.requirements().has(RequirementSet.AUTOMATION);
    }

    @Override
    public TrackDecision decide(ProvisioningDecisionContext context) {
        boolean custom = !context.isGeneral()
                && (context.integer("monthlyVolume") >= 5000
                || context.contains("currentProcess", "critical")
                || context.contains("failureHandling", "compensate"));
        ProvisioningRoute route = custom
                ? ProvisioningRoute.PROVISION_AUTOMATION_CUSTOM
                : ProvisioningRoute.PROVISION_AUTOMATION_MANAGED;
        AutomationLevel level = custom || isSimpleInternal(context)
                ? AutomationLevel.A3
                : AutomationLevel.A2;
        List<ProvisioningDecision.ToolDecision> selected = selectedTools(context, custom);

        return new TrackDecision(
                track(),
                route,
                custom ? "AUTOMATION-CUSTOM-CRITICAL" : "AUTOMATION-MANAGED-STANDARD",
                List.of(
                        "trigger=" + context.value("trigger", "primaryGoal"),
                        "channels=" + context.value("channels"),
                        "volume=" + context.integer("monthlyVolume")
                ),
                custom
                        ? "Critical volume and retry semantics require owned backend processing."
                        : "The requested trigger and action fit a managed workflow or existing Altaira capability.",
                context.isGeneral() ? 0.80 : 0.94,
                !isSimpleInternal(context),
                level,
                selected,
                planItems(context, selected),
                manualSteps(context, custom),
                List.of(
                        "Delivery and rate limit failures require monitoring.",
                        "Duplicates, field mapping and API limits require idempotent workflow design.",
                        "Consent, timezone and duplicate reminder rules must be explicit.",
                        "Payment events require signature verification and duplicate event protection.",
                        "Task ownership and duplicate task prevention require stable keys.",
                        "Data mapping and provider dependency can block cross-application flows.",
                        "Approval and permissions must prevent unauthorized execution.",
                        "Custom retry and compensation rules must avoid data loss and protect availability."
                )
        );
    }

    private boolean isSimpleInternal(ProvisioningDecisionContext context) {
        return context.integer("monthlyVolume") < 100
                && (context.equalsAny("channels", "email", "altaira crm"));
    }

    private List<ProvisioningDecision.ToolDecision> selectedTools(
            ProvisioningDecisionContext context,
            boolean custom
    ) {
        List<ProvisioningDecision.ToolDecision> result = new ArrayList<>();
        if (custom) {
            result.add(tools.select("NEON", true, "Durable workflow state."));
            result.add(tools.select("QUEUE", true, "Retry and compensation queue."));
            result.add(tools.select("RENDER", true, "Owned workflow runtime."));
            return result;
        }
        if (context.isGeneral()) {
            if (context.contains("primaryGoal", "bookings")) {
                result.add(tools.select("RESEND", true, "Booking confirmations and reminders."));
            } else if (context.contains("primaryGoal", "lead_management")) {
                result.add(tools.select("ALTAIRA", true, "Lead status source."));
                result.add(tools.select("AUTOMATION_PLATFORM", true, "Cross-step lead follow-up."));
                result.add(tools.select("RESEND", true, "Lead follow-up notifications."));
            } else {
                result.add(tools.select("AUTOMATION_PLATFORM", true, "Managed cross-system workflow."));
            }
            return result;
        }

        String channels = context.value("channels");
        if (channels.equals("email")) {
            result.add(tools.select("RESEND", true, "Transactional email action."));
        } else if (channels.contains("form and crm")) {
            result.add(tools.select("ALTAIRA", true, "CRM destination."));
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Form-to-CRM orchestration."));
        } else if (channels.contains("calendar")) {
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Calendar trigger orchestration."));
            result.add(tools.select("CALENDAR", true, "Calendar event source."));
            result.add(tools.select("RESEND", true, "Reminder delivery."));
        } else if (channels.contains("stripe")) {
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Payment event orchestration."));
            result.add(tools.select("RESEND", true, "Receipt and alert delivery."));
            result.add(tools.select("STRIPE", true, "Signed payment event source."));
        } else if (channels.equals("altaira crm")) {
            result.add(tools.select("ALTAIRA", true, "Internal task action."));
        } else if (channels.contains("altaira and email")) {
            result.add(tools.select("ALTAIRA", true, "Approval state source."));
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Approval-gated orchestration."));
        } else {
            result.add(tools.select("AUTOMATION_PLATFORM", true, "Managed integration workflow."));
        }
        return result;
    }

    private List<ProvisioningDecision.ManualStepDecision> manualSteps(
            ProvisioningDecisionContext context,
            boolean custom
    ) {
        List<ProvisioningDecision.ManualStepDecision> result = new ArrayList<>();
        if (context.isGeneral()) {
            if (context.contains("primaryGoal", "lead_management")) {
                result.add(tools.manual("FIELD_MAPPING", "Approve automation fields", "Lead fields need mapping.", true));
            }
            if (context.contains("primaryGoal", "automation")) {
                result.add(tools.manual("AUTOMATION_APPROVAL", "Approve automation scope", "The owner must approve automated actions.", true));
            }
            return result;
        }
        if (custom) {
            result.add(tools.manual("ARCHITECTURE_REVIEW", "Review workflow architecture", "Critical processing needs technical approval.", true));
            result.add(tools.manual("SECRETS", "Provide secrets securely", "Credentials require a secure channel.", true));
            result.add(tools.manual("OBSERVABILITY", "Approve monitoring", "Retry visibility is required.", true));
            result.add(tools.manual("LOAD_TESTING", "Approve load test", "Critical volume requires load validation.", true));
            if (context.yes("approvalWorkflow")) {
                result.add(tools.manual("APPROVAL_RULES", "Approve workflow gate", "Human approval conditions and approver roles must be explicit.", true));
            }
            return result;
        }
        String channels = context.value("channels");
        if (channels.equals("email")) {
            result.add(tools.manual("SENDER_VERIFICATION", "Verify sender", "Sender ownership requires verification.", true));
            result.add(tools.manual("TEMPLATE_APPROVAL", "Approve email template", "The business must approve customer-facing copy.", true));
        } else if (channels.contains("form and crm")) {
            result.add(tools.manual("FIELD_MAPPING", "Map form fields", "Source and destination fields require mapping.", true));
            result.add(tools.manual("CREDENTIAL_CONNECTION", "Connect CRM credentials", "Credentials require owner authorization.", true));
            result.add(tools.manual("TESTING", "Approve workflow test", "The data flow needs acceptance testing.", true));
        } else if (channels.contains("calendar")) {
            result.add(tools.manual("OAUTH_CONSENT", "Authorize calendar", "OAuth requires owner consent.", true));
            result.add(tools.manual("TEMPLATE_APPROVAL", "Approve reminder", "Reminder copy requires approval.", true));
            result.add(tools.manual("TESTING", "Approve reminder test", "Timezone handling needs testing.", true));
        } else if (channels.contains("stripe")) {
            result.add(tools.manual("PAYMENT_KYC", "Complete Stripe verification", "KYC is manual.", true));
            result.add(tools.manual("WEBHOOK_SETUP", "Verify payment webhook", "Signing secrets require secure setup.", true));
            result.add(tools.manual("TEMPLATE_APPROVAL", "Approve payment message", "Customer copy needs approval.", true));
        } else if (channels.equals("altaira crm")) {
            result.add(tools.manual("TASK_TEMPLATE", "Approve task template", "The default task needs review.", true));
            result.add(tools.manual("OWNERSHIP_RULES", "Approve ownership rules", "Task assignment must be explicit.", true));
        } else if (channels.contains("altaira and email")) {
            result.add(tools.manual("APPROVAL_RULES", "Approve workflow gate", "Approval conditions need validation.", true));
            result.add(tools.manual("ROLE_MAPPING", "Map approver roles", "Permissions must be explicit.", true));
            result.add(tools.manual("TESTING", "Approve gated workflow test", "Unauthorized execution must be tested.", true));
        } else {
            result.add(tools.manual("CREDENTIAL_CONNECTION", "Connect applications", "Credentials require owner authorization.", true));
            result.add(tools.manual("FIELD_MAPPING", "Map application data", "Transformation rules need approval.", true));
            result.add(tools.manual("TESTING", "Approve sync test", "Failure handling needs validation.", true));
        }
        if (context.yes("approvalWorkflow")) {
            result.add(tools.manual("APPROVAL_RULES", "Approve workflow gate", "Human approval conditions and approver roles must be explicit.", true));
        }
        return result;
    }

    private List<ProvisioningDecision.PlanItemDecision> planItems(
            ProvisioningDecisionContext context,
            List<ProvisioningDecision.ToolDecision> selected
    ) {
        return selected.stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(tool -> tools.item(tool.key(), "TRACK_RESOURCE", context.businessName() + " automation", "PREPARE", tool.reason()))
                .toList();
    }
}
