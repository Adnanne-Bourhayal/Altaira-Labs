package com.altaira.backend.integration.provisioning;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class ProvisioningProviderRegistry {

    private final Map<String, ProvisioningProvider> providers;

    public ProvisioningProviderRegistry(List<ProvisioningProvider> providers) {
        Map<String, ProvisioningProvider> indexed = new LinkedHashMap<>();
        providers.forEach(provider -> indexed.put(provider.key(), provider));
        this.providers = Map.copyOf(indexed);
    }

    public Optional<ProvisioningProvider> find(String key) {
        return Optional.ofNullable(providers.get(key));
    }

    public ProvisioningResult prepare(String key, ProvisioningRequest request) {
        return find(key)
                .map(provider -> provider.prepare(request))
                .orElseGet(() -> ProvisioningResult.unregistered(request));
    }

    public List<ProvisioningProvider> all() {
        return List.copyOf(providers.values());
    }
}
