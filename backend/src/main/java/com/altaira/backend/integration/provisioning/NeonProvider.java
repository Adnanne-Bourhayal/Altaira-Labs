package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class NeonProvider extends DryRunProvisioningProvider {
    public NeonProvider() {
        super("NEON", "Neon PostgreSQL", AutomationLevel.A3);
    }
}
