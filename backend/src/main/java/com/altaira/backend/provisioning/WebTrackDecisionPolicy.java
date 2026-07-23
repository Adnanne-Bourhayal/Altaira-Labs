package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.ArrayList;
import java.util.List;

public final class WebTrackDecisionPolicy implements TrackDecisionPolicy {

    private final ProvisioningToolCatalog tools;

    public WebTrackDecisionPolicy(ProvisioningToolCatalog tools) {
        this.tools = tools;
    }

    @Override
    public ProvisioningTrack track() {
        return ProvisioningTrack.WEB;
    }

    @Override
    public boolean supports(ProvisioningDecisionContext context) {
        return context.recommends(track())
                || "web_seo".equals(context.formKey())
                || context.requirements().has(RequirementSet.STATIC_SITE)
                || context.requirements().has(RequirementSet.CMS);
    }

    @Override
    public TrackDecision decide(ProvisioningDecisionContext context) {
        ProvisioningRoute route = route(context);
        List<ProvisioningDecision.ToolDecision> selected = selectedTools(context, route);
        List<ProvisioningDecision.ManualStepDecision> manual = manualSteps(context, route);
        AutomationLevel level = automationLevel(context, route);
        boolean manualDecision = route == ProvisioningRoute.PROVISION_WEB_CMS
                || route == ProvisioningRoute.PROVISION_ECOMMERCE_PLATFORM;

        return new TrackDecision(
                track(),
                route,
                ruleId(route),
                matchedSignals(context, route),
                reason(route),
                context.isGeneral() ? 0.82 : 0.96,
                manualDecision,
                level,
                selected,
                planItems(context, route, selected),
                manual,
                risks(route)
        );
    }

    private ProvisioningRoute route(ProvisioningDecisionContext context) {
        if (context.equalsAny("solutionShape", "ecommerce", "online_store")) {
            boolean platformFit = context.yes("contentManagement")
                    && !context.yes("authentication", "dataPersistence")
                    && !context.equalsAny("externalIntegrations", "custom");
            return platformFit
                    ? ProvisioningRoute.PROVISION_ECOMMERCE_PLATFORM
                    : ProvisioningRoute.PROVISION_ECOMMERCE_CUSTOM;
        }
        if (context.requirements().has(RequirementSet.CMS)) {
            return ProvisioningRoute.PROVISION_WEB_CMS;
        }
        if (context.equalsAny("solutionShape", "custom_app", "web_application", "custom")
                || context.requirements().has(RequirementSet.BACKEND)
                && !context.isGeneral()
                && "web_seo".equals(context.formKey())) {
            return ProvisioningRoute.PROVISION_WEB_CUSTOM;
        }
        return ProvisioningRoute.PROVISION_WEB_STATIC;
    }

    private List<ProvisioningDecision.ToolDecision> selectedTools(
            ProvisioningDecisionContext context,
            ProvisioningRoute route
    ) {
        List<ProvisioningDecision.ToolDecision> result = new ArrayList<>();
        switch (route) {
            case PROVISION_WEB_STATIC -> {
                result.add(tools.select("GITHUB", true, "Versioned static website source."));
                result.add(tools.select("VERCEL", true, "Static preview and hosting."));
                if (context.contains("coreOffer", "vehicle")) {
                    result.add(tools.select("FIGMA", false, "The visual showroom requires design approval."));
                }
                if (context.requirements().has(RequirementSet.EXTERNAL_INTEGRATIONS)) {
                    result.add(tools.select("RESEND", true, "The public form needs a controlled lead destination."));
                }
            }
            case PROVISION_WEB_CMS -> {
                result.add(tools.select("CMS", true, "Editors need managed structured content."));
                if (context.contains("targetLocations", "belgium", "benelux")) {
                    result.add(tools.select("I18N", true, "Multiple target markets require localized content."));
                }
            }
            case PROVISION_WEB_CUSTOM -> {
                result.add(tools.select("GITHUB", true, "Custom application source."));
                result.add(tools.select("VERCEL", true, "Custom frontend deployment."));
                result.add(tools.select("RENDER", true, "Custom backend runtime."));
                result.add(tools.select("NEON", true, "Application persistence."));
                if (!context.requirements().has(RequirementSet.AUTH)
                        || context.requirements().has(RequirementSet.EXTERNAL_INTEGRATIONS)) {
                    result.add(tools.select("JIRA", true, "Technical delivery backlog."));
                    result.add(tools.select("DRIVE", true, "Discovery and delivery resources."));
                }
                if (context.requirements().has(RequirementSet.AUTH)) {
                    result.add(tools.select("AUTH", true, "Protected application access."));
                }
            }
            case PROVISION_ECOMMERCE_PLATFORM ->
                    result.add(tools.select("ECOMMERCE_PLATFORM", true, "Standard commerce fits a managed platform."));
            case PROVISION_ECOMMERCE_CUSTOM -> {
                result.add(tools.select("GITHUB", true, "Custom commerce source."));
                result.add(tools.select("VERCEL", true, "Commerce frontend deployment."));
                result.add(tools.select("RENDER", true, "Custom commerce backend."));
                result.add(tools.select("NEON", true, "Custom stock and order persistence."));
                result.add(tools.select("AUTH", true, "Protected commerce workflows."));
                result.add(tools.select("STRIPE", true, "Custom checkout processing."));
            }
            default -> throw new IllegalStateException("Unsupported web route: " + route);
        }
        addExclusions(result, route);
        return result;
    }

    private void addExclusions(List<ProvisioningDecision.ToolDecision> result, ProvisioningRoute route) {
        if (route == ProvisioningRoute.PROVISION_WEB_STATIC || route == ProvisioningRoute.PROVISION_WEB_CMS) {
            result.add(tools.exclude("RENDER", "No custom backend is required."));
            result.add(tools.exclude("NEON", "No custom database is required."));
            result.add(tools.exclude("STRIPE", "No custom payment flow is required."));
            result.add(tools.exclude("AUTH", "No protected application area is required."));
        }
        if (route == ProvisioningRoute.PROVISION_WEB_STATIC) {
            result.add(tools.exclude("CMS", "The website does not require managed editing."));
        }
        if (route == ProvisioningRoute.PROVISION_WEB_CUSTOM) {
            result.add(tools.exclude("STRIPE", "No payment flow was requested."));
            result.add(tools.exclude("CMS", "The custom application does not require managed content."));
            if (result.stream().noneMatch(tool -> tool.key().equals("AUTH")
                    && "selected".equals(tool.selectionState()))) {
                result.add(tools.exclude("AUTH", "No protected user area was requested."));
            }
        }
    }

    private List<ProvisioningDecision.ManualStepDecision> manualSteps(
            ProvisioningDecisionContext context,
            ProvisioningRoute route
    ) {
        List<ProvisioningDecision.ManualStepDecision> result = new ArrayList<>();
        if (context.isGeneral()) {
            result.add(tools.manual("CONTENT_APPROVAL", "Approve web content", "The business must approve public content.", true));
            if (context.contains("primaryGoal", "lead_management")) {
                result.add(tools.manual("INVENTORY_MAPPING", "Map inventory content", "Vehicle inventory ownership must be agreed.", true));
            }
            return result;
        }
        switch (route) {
            case PROVISION_WEB_STATIC -> {
                if (context.contains("coreOffer", "clinic")) {
                    result.add(tools.manual("CONTENT_APPROVAL", "Approve regulated content", "Clinic claims require owner approval.", true));
                    result.add(tools.manual("PRIVACY", "Review privacy content", "Health-related enquiries require a privacy review.", true));
                } else if (context.contains("coreOffer", "vehicle")) {
                    result.add(tools.manual("DESIGN_APPROVAL", "Approve showroom design", "Visual presentation requires approval.", true));
                    result.add(tools.manual("MEDIA_RIGHTS", "Confirm image rights", "Vehicle media ownership must be confirmed.", true));
                } else if (context.requirements().has(RequirementSet.EXTERNAL_INTEGRATIONS)) {
                    result.add(tools.manual("FORM_DESTINATION", "Confirm lead destination", "The contact destination requires owner approval.", true));
                    result.add(tools.manual("PRIVACY", "Approve form consent", "Consent language must be approved.", true));
                } else {
                    result.add(tools.manual("SEARCH_CONSOLE", "Verify Search Console", "Search ownership requires manual verification.", false));
                }
                result.add(tools.manual("DOMAIN", "Confirm domain ownership", "DNS ownership cannot be inferred.", true));
            }
            case PROVISION_WEB_CMS -> {
                if (context.contains("targetLocations", "belgium", "benelux")) {
                    result.add(tools.manual("TRANSLATION_APPROVAL", "Approve translations", "Localized content requires review.", true));
                }
                result.add(tools.manual("CMS_ACCOUNT", "Confirm CMS owner", "The client must own the provider account.", true));
                if (context.contains("requiredPages", "blog")) {
                    result.add(tools.manual("EDITORIAL_WORKFLOW", "Approve editorial workflow", "Publishing roles need agreement.", true));
                } else if (context.equalsAny("contentReady", "no")) {
                    result.add(tools.manual("CONTENT_APPROVAL", "Approve initial content", "The CMS cannot launch without content.", true));
                }
                result.add(tools.manual("DOMAIN", "Confirm domain ownership", "DNS ownership cannot be inferred.", true));
            }
            case PROVISION_WEB_CUSTOM -> {
                result.add(tools.manual("SECURITY", "Review security architecture", "Custom data boundaries require review.", true));
                result.add(tools.manual("SECRETS", "Provide secrets securely", "Secrets cannot come from intake answers.", true));
                result.add(tools.manual("DOMAIN", "Confirm domain ownership", "DNS changes require approval.", true));
                if (context.contains("coreOffer", "private client")) {
                    result.add(tools.manual("PRIVACY", "Review private data", "Private client data requires a privacy review.", true));
                }
                if (context.contains("coreOffer", "vehicle inventory")) {
                    result.add(tools.manual("INVENTORY_MAPPING", "Map inventory source", "Stock ownership and refresh rules require review.", true));
                }
            }
            case PROVISION_ECOMMERCE_PLATFORM -> {
                result.add(tools.manual("COMMERCE_ACCOUNT", "Create commerce account", "The client must own the commerce account.", true));
                result.add(tools.manual("PAYMENT_KYC", "Complete payment verification", "KYC cannot be automated by Altaira.", true));
                result.add(tools.manual("CATALOG_IMPORT", "Review product catalogue", "Catalogue and tax data require validation.", true));
                result.add(tools.manual("DOMAIN", "Confirm domain ownership", "DNS ownership requires approval.", true));
            }
            case PROVISION_ECOMMERCE_CUSTOM -> {
                result.add(tools.manual("SECURITY", "Review commerce security", "Custom commerce requires security review.", true));
                result.add(tools.manual("SECRETS", "Provide secrets securely", "Secrets require a secure channel.", true));
                result.add(tools.manual("PAYMENT_KYC", "Complete payment verification", "Payment KYC is manual.", true));
                result.add(tools.manual("COMMERCE_RULES", "Approve stock and checkout rules", "Custom rules require owner approval.", true));
                result.add(tools.manual("DOMAIN", "Confirm domain ownership", "DNS ownership requires approval.", true));
            }
            default -> throw new IllegalStateException("Unsupported web route: " + route);
        }
        if (context.equalsAny("languages", "multilingual")) {
            result.add(tools.manual("TRANSLATION_APPROVAL", "Approve translations", "Every published language needs an owner and review.", true));
        }
        if (context.equalsAny("maintenanceOwner", "unknown")) {
            result.add(tools.manual("SUPPORT_OWNERSHIP", "Confirm maintenance owner", "Post-launch content and maintenance ownership is unresolved.", true));
        }
        if (context.yes("sensitiveData")) {
            result.add(tools.manual("PRIVACY", "Review sensitive web data", "Forms and private areas require a data-minimisation review.", true));
        }
        return result;
    }

    private List<ProvisioningDecision.PlanItemDecision> planItems(
            ProvisioningDecisionContext context,
            ProvisioningRoute route,
            List<ProvisioningDecision.ToolDecision> selected
    ) {
        return selected.stream()
                .filter(tool -> "selected".equals(tool.selectionState()))
                .map(tool -> tools.item(tool.key(), "TRACK_RESOURCE", context.businessName() + " web", "PREPARE", reason(route)))
                .toList();
    }

    private AutomationLevel automationLevel(ProvisioningDecisionContext context, ProvisioningRoute route) {
        if (route == ProvisioningRoute.PROVISION_WEB_CUSTOM || route == ProvisioningRoute.PROVISION_ECOMMERCE_CUSTOM) {
            return AutomationLevel.A3;
        }
        if (route == ProvisioningRoute.PROVISION_WEB_STATIC
                && context.equalsAny("websiteState", "none")
                && !context.requirements().has(RequirementSet.EXTERNAL_INTEGRATIONS)
                && context.value("coreOffer").isBlank()) {
            return AutomationLevel.A3;
        }
        return AutomationLevel.A2;
    }

    private String ruleId(ProvisioningRoute route) {
        return "WEB-" + route.name().replace("PROVISION_", "");
    }

    private List<String> matchedSignals(ProvisioningDecisionContext context, ProvisioningRoute route) {
        return List.of("form=" + context.formKey(), "route=" + route.name(), "cms=" + context.requirements().has(RequirementSet.CMS));
    }

    private String reason(ProvisioningRoute route) {
        return switch (route) {
            case PROVISION_WEB_STATIC -> "A static delivery covers the requested public presence without custom persistence.";
            case PROVISION_WEB_CMS -> "Managed content editing is required without a custom application backend.";
            case PROVISION_WEB_CUSTOM -> "The requested workflow needs custom application infrastructure.";
            case PROVISION_ECOMMERCE_PLATFORM -> "A managed commerce platform covers the standard catalogue and checkout.";
            case PROVISION_ECOMMERCE_CUSTOM -> "Custom stock or checkout rules require owned application code.";
            default -> throw new IllegalStateException("Unsupported web route: " + route);
        };
    }

    private List<String> risks(ProvisioningRoute route) {
        return switch (route) {
            case PROVISION_WEB_STATIC -> List.of(
                    "Domain ownership and DNS access must be confirmed.",
                    "Privacy, consent, health claims, media rights, spam controls and lead delivery need content review."
            );
            case PROVISION_WEB_CMS -> List.of(
                    "Provider dependency and maintenance ownership must be accepted.",
                    "Content readiness, translation and content consistency can delay launch.",
                    "Inventory consistency and image rights require review for catalogue-driven businesses."
            );
            case PROVISION_WEB_CUSTOM -> List.of(
                    "Security and tenancy boundaries require review; sensitive data needs tenant isolation and authentication.",
                    "Provider quotas, media storage, inventory consistency and missing secrets can block delivery."
            );
            case PROVISION_ECOMMERCE_PLATFORM -> List.of(
                    "Provider dependency, payments, catalogue quality and tax configuration require business approval."
            );
            case PROVISION_ECOMMERCE_CUSTOM -> List.of(
                    "Payments, stock consistency and security are critical custom-commerce risks."
            );
            default -> List.of();
        };
    }
}
