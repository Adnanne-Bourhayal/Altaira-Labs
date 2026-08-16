package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class ResendProvider extends DryRunProvisioningProvider {
    public ResendProvider() {
        super("RESEND", "Resend", AutomationLevel.A1);
    }
}
