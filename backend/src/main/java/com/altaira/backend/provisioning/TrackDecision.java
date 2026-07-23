package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;
import com.altaira.backend.model.ProvisioningRoute;

import java.util.List;

public record TrackDecision(
        ProvisioningTrack track,
        ProvisioningRoute route,
        String ruleId,
        List<String> matchedSignals,
        String reason,
        double confidence,
        boolean requiresManualDecision,
        AutomationLevel automationLevel,
        List<ProvisioningDecision.ToolDecision> tools,
        List<ProvisioningDecision.PlanItemDecision> items,
        List<ProvisioningDecision.ManualStepDecision> manualSteps,
        List<String> risks
) {
    public TrackDecision {
        matchedSignals = List.copyOf(matchedSignals);
        tools = List.copyOf(tools);
        items = List.copyOf(items);
        manualSteps = List.copyOf(manualSteps);
        risks = List.copyOf(risks);
    }
}
