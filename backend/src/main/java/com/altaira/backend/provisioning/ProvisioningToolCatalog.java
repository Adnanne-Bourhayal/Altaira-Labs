package com.altaira.backend.provisioning;

import com.altaira.backend.integration.provisioning.ProvisioningProvider;
import com.altaira.backend.integration.provisioning.ProvisioningProviderRegistry;
import com.altaira.backend.model.AutomationLevel;

import java.util.Map;

public final class ProvisioningToolCatalog {

    private static final Map<String, String> DISPLAY_NAMES = Map.ofEntries(
            Map.entry("ALTAIRA", "Altaira Workspace"),
            Map.entry("AUTH", "Authentication"),
            Map.entry("AUTOMATION_PLATFORM", "Automation platform"),
            Map.entry("BI", "Business intelligence platform"),
            Map.entry("BOOKING_SAAS", "Booking SaaS"),
            Map.entry("CALENDAR", "Calendar integration"),
            Map.entry("CMS", "Content management system"),
            Map.entry("ECOMMERCE_PLATFORM", "Ecommerce platform"),
            Map.entry("EXTERNAL_CRM", "External CRM"),
            Map.entry("FIGMA", "Figma"),
            Map.entry("I18N", "Internationalization"),
            Map.entry("QUEUE", "Queue"),
            Map.entry("REALTIME", "Realtime infrastructure"),
            Map.entry("TASKS", "Task management"),
            Map.entry("WEBHOOK", "Webhook intake")
    );

    private final ProvisioningProviderRegistry providerRegistry;

    public ProvisioningToolCatalog(ProvisioningProviderRegistry providerRegistry) {
        this.providerRegistry = providerRegistry;
    }

    public ProvisioningDecision.ToolDecision select(String key, boolean required, String reason) {
        ProvisioningProvider provider = providerRegistry.find(key).orElse(null);
        return new ProvisioningDecision.ToolDecision(
                key,
                provider == null ? DISPLAY_NAMES.getOrDefault(key, key) : provider.displayName(),
                "selected",
                provider == null ? AutomationLevel.A3 : provider.automationLevel(),
                required,
                reason
        );
    }

    public ProvisioningDecision.ToolDecision exclude(String key, String reason) {
        ProvisioningProvider provider = providerRegistry.find(key).orElse(null);
        return new ProvisioningDecision.ToolDecision(
                key,
                provider == null ? DISPLAY_NAMES.getOrDefault(key, key) : provider.displayName(),
                "excluded",
                AutomationLevel.M,
                false,
                reason
        );
    }

    public ProvisioningDecision.PlanItemDecision item(
            String provider,
            String type,
            String name,
            String action,
            String reason
    ) {
        return new ProvisioningDecision.PlanItemDecision(provider, type, name, action, true, reason);
    }

    public ProvisioningDecision.ManualStepDecision manual(
            String key,
            String title,
            String reason,
            boolean required
    ) {
        return new ProvisioningDecision.ManualStepDecision(key, title, reason, required);
    }
}
