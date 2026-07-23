package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;

public interface ProvisioningProvider {
    String key();
    String displayName();
    AutomationLevel automationLevel();

    default ProvisioningResult prepare(ProvisioningRequest request) {
        if (request.blockWhenCredentialsMissing() && !request.credentialsConfigured()) {
            return ProvisioningResult.blocked(request);
        }
        return ProvisioningResult.dryRun(request);
    }

    default boolean executionSupported() {
        return false;
    }
}
