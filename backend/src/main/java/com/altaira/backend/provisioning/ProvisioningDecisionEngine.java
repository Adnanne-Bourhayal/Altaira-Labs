package com.altaira.backend.provisioning;

import com.altaira.backend.integration.provisioning.ProvisioningProviderRegistry;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ProvisioningDecisionEngine {

    private final ProvisioningToolCatalog tools;
    private final List<TrackDecisionPolicy> policies;

    public ProvisioningDecisionEngine(ProvisioningProviderRegistry providerRegistry) {
        this.tools = new ProvisioningToolCatalog(providerRegistry);
        this.policies = List.of(
                new WebTrackDecisionPolicy(tools),
                new BookingTrackDecisionPolicy(tools),
                new CrmTrackDecisionPolicy(tools),
                new AutomationTrackDecisionPolicy(tools),
                new DashboardTrackDecisionPolicy(tools)
        );
    }

    public ProvisioningDecision decide(RequirementSet requirements, String businessName) {
        List<String> inferredServices = inferServices(requirements);
        return decide(requirements, "general", Map.of(), inferredServices, businessName);
    }

    public ProvisioningDecision decide(
            RequirementSet requirements,
            String formKey,
            Map<String, Object> responses,
            List<String> recommendedServices,
            String businessName
    ) {
        ProvisioningDecisionContext context = new ProvisioningDecisionContext(
                requirements,
                formKey,
                responses,
                recommendedServices,
                businessName
        );
        List<TrackDecision> tracks = policies.stream()
                .filter(policy -> policy.supports(context))
                .map(policy -> policy.decide(context))
                .toList();
        if (tracks.isEmpty()) {
            tracks = List.of(new WebTrackDecisionPolicy(tools).decide(context));
        }

        List<ProvisioningDecision.ManualStepDecision> planSteps = new ArrayList<>();
        if (context.isGeneral() && tracks.size() > 1) {
            planSteps.add(tools.manual(
                    "DISCOVERY_APPROVAL",
                    "Approve the composed solution",
                    "The admin must confirm scope before provisioning.",
                    true
            ));
        }
        return ProvisioningDecision.compose(tracks, planSteps);
    }

    private List<String> inferServices(RequirementSet requirements) {
        List<String> services = new ArrayList<>();
        if (requirements.has(RequirementSet.FRONTEND)
                || requirements.has(RequirementSet.STATIC_SITE)
                || requirements.has(RequirementSet.CMS)) {
            services.add(ProvisioningTrack.WEB.serviceKey());
        }
        if (requirements.has(RequirementSet.BOOKING)) services.add(ProvisioningTrack.BOOKING.serviceKey());
        if (requirements.has(RequirementSet.CRM)) services.add(ProvisioningTrack.CRM.serviceKey());
        if (requirements.has(RequirementSet.AUTOMATION)) services.add(ProvisioningTrack.AUTOMATION.serviceKey());
        if (requirements.has(RequirementSet.DASHBOARD)) services.add(ProvisioningTrack.DASHBOARD.serviceKey());
        if (services.isEmpty()) services.add(ProvisioningTrack.WEB.serviceKey());
        return services;
    }
}
