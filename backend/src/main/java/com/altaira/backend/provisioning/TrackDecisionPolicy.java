package com.altaira.backend.provisioning;

public interface TrackDecisionPolicy {
    ProvisioningTrack track();
    boolean supports(ProvisioningDecisionContext context);
    TrackDecision decide(ProvisioningDecisionContext context);
}
