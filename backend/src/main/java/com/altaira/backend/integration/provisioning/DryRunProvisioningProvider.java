package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;

abstract class DryRunProvisioningProvider implements ProvisioningProvider {

    private final String key;
    private final String displayName;
    private final AutomationLevel automationLevel;

    protected DryRunProvisioningProvider(String key, String displayName, AutomationLevel automationLevel) {
        this.key = key;
        this.displayName = displayName;
        this.automationLevel = automationLevel;
    }

    @Override
    public String key() {
        return key;
    }

    @Override
    public String displayName() {
        return displayName;
    }

    @Override
    public AutomationLevel automationLevel() {
        return automationLevel;
    }
}
