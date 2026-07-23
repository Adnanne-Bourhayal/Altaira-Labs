package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class JiraProvider extends DryRunProvisioningProvider {
    public JiraProvider() {
        super("JIRA", "Jira", AutomationLevel.A3);
    }
}
