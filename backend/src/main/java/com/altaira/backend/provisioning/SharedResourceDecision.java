package com.altaira.backend.provisioning;

import com.altaira.backend.model.AutomationLevel;

import java.util.List;

public record SharedResourceDecision(
        String key,
        String displayName,
        String selectionState,
        AutomationLevel automationLevel,
        boolean required,
        String reason,
        List<ProvisioningTrack> usedByTracks
) {
    public SharedResourceDecision {
        usedByTracks = List.copyOf(usedByTracks);
    }
}
