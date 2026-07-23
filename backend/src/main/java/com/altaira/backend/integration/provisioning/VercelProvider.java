package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class VercelProvider extends DryRunProvisioningProvider {
    public VercelProvider() {
        super("VERCEL", "Vercel", AutomationLevel.A3);
    }
}
