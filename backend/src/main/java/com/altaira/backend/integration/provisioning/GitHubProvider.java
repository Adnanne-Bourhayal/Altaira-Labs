package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class GitHubProvider extends DryRunProvisioningProvider {
    public GitHubProvider() {
        super("GITHUB", "GitHub", AutomationLevel.A3);
    }
}
