package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class StripeProvider extends DryRunProvisioningProvider {
    public StripeProvider() {
        super("STRIPE", "Stripe", AutomationLevel.A2);
    }
}
