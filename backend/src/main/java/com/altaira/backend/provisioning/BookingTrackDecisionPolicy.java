package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.List;

public final class BookingTrackDecisionPolicy implements TrackDecisionPolicy {

    private final ProvisioningToolCatalog tools;

    public BookingTrackDecisionPolicy(ProvisioningToolCatalog tools) {
        this.tools = tools;
    }

    @Override
    public ProvisioningTrack track() {
        return ProvisioningTrack.BOOKING;
    }

    @Override
    public boolean supports(ProvisioningDecisionContext context) {
        return context.recommends(track())
                || "booking".equals(context.formKey())
                || context.requirements().has(RequirementSet.BOOKING);
    }

    @Override
    public TrackDecision decide(ProvisioningDecisionContext context) {
        boolean custom = !context.isGeneral()
                && (context.contains("bookingType", "resource and capacity")
                || context.contains("resources", "dependent")
                || context.equalsAny("slotDuration", "variable"));
        ProvisioningRoute route = custom
                ? ProvisioningRoute.PROVISION_BOOKING_CUSTOM
                : ProvisioningRoute.PROVISION_BOOKING_SAAS;
        List<ProvisioningDecision.ToolDecision> selected = selectedTools(context, route);

        return new TrackDecision(
                track(),
                route,
                custom ? "BOOKING-CUSTOM-COMPLEX-RESOURCES" : "BOOKING-SAAS-STANDARD",
                List.of(
                        "bookingType=" + context.value("bookingType", "primaryGoal"),
                        "resources=" + context.value("resources"),
                        "deposit=" + context.yes("depositRequired")
                ),
                custom
                        ? "Dependent resources and variable capacity require a custom reservation engine."
                        : "Standard appointments, resources and policies fit a managed booking platform.",
                context.isGeneral() ? 0.82 : 0.95,
                !custom,
                custom ? AutomationLevel.A3 : AutomationLevel.A2,
                selected,
                planItems(context, selected),
                manualSteps(context, custom),
                List.of(
                        "Provider dependency and availability limits must be accepted.",
                        "Opening hours, service duration, resource availability and location rules require validation.",
                        "Calendar conflict, staff availability, OAuth and external calendar consent need testing.",
                        "Cancellation, customer communication, refund and payment rules require owner approval.",
                        "Complex implementations risk double booking or overbooking and require access-control review.",
                        "Privacy controls are required when appointment data can identify a person."
                )
        );
    }

    private List<ProvisioningDecision.ToolDecision> selectedTools(
            ProvisioningDecisionContext context,
            ProvisioningRoute route
    ) {
        List<ProvisioningDecision.ToolDecision> result = new ArrayList<>();
        if (route == ProvisioningRoute.PROVISION_BOOKING_CUSTOM) {
            result.add(tools.select("AUTH", true, "Protected booking administration."));
            result.add(tools.select("CALENDAR", true, "Availability model and calendar integration."));
            result.add(tools.select("DRIVE", true, "Rules and policies."));
            result.add(tools.select("GITHUB", true, "Custom booking source."));
            result.add(tools.select("JIRA", true, "Technical delivery backlog."));
            result.add(tools.select("NEON", true, "Reservation persistence."));
            result.add(tools.select("RENDER", true, "Reservation API runtime."));
            result.add(tools.select("RESEND", true, "Reservation notifications."));
            result.add(tools.select("VERCEL", true, "Booking widget deployment."));
            if (context.requirements().has(RequirementSet.PAYMENTS)) {
                result.add(tools.select("STRIPE", true, "Booking deposits."));
            } else {
                result.add(tools.exclude("STRIPE", "No deposit was requested."));
            }
            return result;
        }

        result.add(tools.select("BOOKING_SAAS", true, "Managed appointment and capacity workflow."));
        if (context.isGeneral()) {
            result.add(tools.select("CALENDAR", true, "Calendar-backed availability for the recommended booking service."));
            result.add(tools.select("RESEND", true, "Booking confirmations and reminders."));
        } else if (context.equalsAny("currentBookingProcess", "calendar")) {
            result.add(tools.select("CALENDAR", true, "Existing calendar synchronization."));
            result.add(tools.select("RESEND", true, "Booking confirmations and reminders."));
        } else if (context.equalsAny("currentBookingProcess", "existing_tool")) {
            result.add(tools.select("CALENDAR", true, "Existing provider calendar connection."));
        }
        if (context.requirements().has(RequirementSet.PAYMENTS)) {
            result.add(tools.select("RESEND", true, "Payment and reservation messages."));
            result.add(tools.select("STRIPE", true, "Booking deposits."));
        } else if (context.contains("bookingType", "restaurant")) {
            result.add(tools.select("RESEND", true, "Cancellation and reservation messages."));
        }
        result.add(tools.exclude("GITHUB", "Managed booking does not require owned source."));
        result.add(tools.exclude("RENDER", "Managed booking does not require a new backend."));
        result.add(tools.exclude("NEON", "Managed booking does not require a new database."));
        result.add(tools.exclude("VERCEL", "Managed booking supplies the booking surface."));
        return deduplicate(result);
    }

    private List<ProvisioningDecision.ToolDecision> deduplicate(List<ProvisioningDecision.ToolDecision> decisions) {
        List<String> seen = new ArrayList<>();
        return decisions.stream().filter(decision -> {
            if (seen.contains(decision.key())) return false;
            seen.add(decision.key());
            return true;
        }).toList();
    }

    private List<ProvisioningDecision.ManualStepDecision> manualSteps(
            ProvisioningDecisionContext context,
            boolean custom
    ) {
        List<ProvisioningDecision.ManualStepDecision> result = new ArrayList<>();
        if (context.isGeneral()) {
            result.add(tools.manual("BOOKING_RULES", "Approve booking rules", "Opening hours and capacity require approval.", true));
            result.add(tools.manual("OAUTH_CONSENT", "Authorize calendar", "Calendar ownership requires consent.", true));
            result.add(tools.manual("PRIVACY", "Review booking privacy", "Appointment data needs privacy review.", true));
            return result;
        }
        if (custom) {
            result.add(tools.manual("BOOKING_RULES", "Validate booking rules", "Dependent capacity rules require review.", true));
            result.add(tools.manual("CALENDAR", "Authorize calendars", "OAuth consent is manual.", true));
            result.add(tools.manual("SECRETS", "Provide secrets securely", "Credentials cannot be collected in intake.", true));
            result.add(tools.manual("TESTING", "Approve booking tests", "Concurrency requires acceptance tests.", true));
            appendDiscoveryReviews(result, context);
            return result;
        }

        result.add(tools.manual("BOOKING_ACCOUNT", "Create or connect booking account", "The client must own the SaaS account.", true));
        if (context.equalsAny("currentBookingProcess", "calls_messages")
                && context.equalsAny("bookingType", "appointments")) {
            result.add(tools.manual("BOOKING_RULES", "Approve booking rules", "Opening hours and slots require approval.", true));
        }
        if (context.equalsAny("currentBookingProcess", "calendar")) {
            result.add(tools.manual("CALENDAR", "Review calendar connection", "Conflicts require validation.", true));
            result.add(tools.manual("PRIVACY", "Review appointment privacy", "Appointment data requires review.", true));
        }
        if (context.equalsAny("currentBookingProcess", "existing_tool")) {
            result.add(tools.manual("CALENDAR", "Map existing calendar", "Provider calendars require validation.", true));
            result.add(tools.manual("OAUTH_CONSENT", "Authorize provider calendar", "OAuth requires the owner.", true));
        }
        if (context.contains("resources", "professional", "advisor", "location", "table", "capacity")) {
            result.add(tools.manual("RESOURCE_MAPPING", "Map booking resources", "Resources and capacity require validation.", true));
        }
        if (context.contains("bookingType", "multiple appointment")) {
            result.add(tools.manual("SERVICE_CATALOG", "Map service catalogue", "Durations require service mapping.", true));
        }
        if (context.contains("bookingType", "location")) {
            result.add(tools.manual("LOCATION_MAPPING", "Map locations", "Opening hours vary by location.", true));
        }
        if (context.requirements().has(RequirementSet.PAYMENTS)) {
            result.add(tools.manual("PAYMENT_KYC", "Complete payment verification", "KYC is manual.", true));
            result.add(tools.manual("REFUND_POLICY", "Approve refund policy", "The owner must approve refunds.", true));
        }
        if (context.contains("bookingType", "restaurant")) {
            result.add(tools.manual("CANCELLATION_POLICY", "Approve cancellation policy", "The policy must be explicit.", true));
            result.add(tools.manual("TEMPLATE_APPROVAL", "Approve booking messages", "Customer communication requires approval.", true));
        }
        if (result.size() == 1) {
            result.add(tools.manual("BOOKING_RULES", "Approve booking rules", "Opening hours and slots require approval.", true));
        }
        appendDiscoveryReviews(result, context);
        return result;
    }

    private void appendDiscoveryReviews(
            List<ProvisioningDecision.ManualStepDecision> result,
            ProvisioningDecisionContext context
    ) {
        if (context.integer("locationCount") > 1) {
            result.add(tools.manual("LOCATION_MAPPING", "Map location rules", "Each location needs its own hours, timezone and resources.", true));
        }
        if (!context.value("cancellationPolicy").isBlank()) {
            result.add(tools.manual("CANCELLATION_POLICY", "Approve cancellation policy", "The recorded policy must be approved before customer messages are generated.", true));
        }
        if (context.yes("sensitiveData")) {
            result.add(tools.manual("PRIVACY", "Review sensitive booking data", "Only necessary appointment data may be collected.", true));
        }
    }

    private List<ProvisioningDecision.PlanItemDecision> planItems(
            ProvisioningDecisionContext context,
            List<ProvisioningDecision.ToolDecision> selected
    ) {
        return selected.stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(tool -> tools.item(tool.key(), "TRACK_RESOURCE", context.businessName() + " booking", "PREPARE", tool.reason()))
                .toList();
    }
}
