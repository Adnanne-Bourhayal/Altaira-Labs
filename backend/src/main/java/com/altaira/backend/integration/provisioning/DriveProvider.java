package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class DriveProvider extends DryRunProvisioningProvider {
    public DriveProvider() {
        super("DRIVE", "Google Drive", AutomationLevel.A3);
    }
}
