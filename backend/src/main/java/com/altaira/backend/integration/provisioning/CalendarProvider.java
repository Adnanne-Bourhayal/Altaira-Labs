package com.altaira.backend.integration.provisioning;

import com.altaira.backend.model.AutomationLevel;
import org.springframework.stereotype.Component;

@Component
public class CalendarProvider extends DryRunProvisioningProvider {
    public CalendarProvider() {
        super("CALENDAR", "Google Calendar", AutomationLevel.A2);
    }
}
