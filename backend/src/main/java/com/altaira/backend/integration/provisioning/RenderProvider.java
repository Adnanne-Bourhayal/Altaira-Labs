package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class RenderProvider extends DryRunProvisioningProvider {
    public RenderProvider() {
        super("RENDER", "Render", AutomationLevel.A3);
    }
}
