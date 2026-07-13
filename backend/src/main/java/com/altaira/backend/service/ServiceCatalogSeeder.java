package com.altaira.backend.service;

import com.altaira.backend.entity.ServiceEntity;
import com.altaira.backend.repository.ServiceRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ServiceCatalogSeeder {

    private final ServiceRepository serviceRepository;

    public ServiceCatalogSeeder(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedServices() {
        List<SeedService> services = List.of(
                new SeedService("Website Development", "Web", "Professional websites and landing pages that capture leads."),
                new SeedService("Booking Systems", "Operations", "Online booking flows, reminders, and scheduling support."),
                new SeedService("Automation Workflows", "Automation", "Automations for repetitive follow-up and internal tasks."),
                new SeedService("Internal Dashboards", "Operations", "Dashboards for leads, clients, services, and business visibility."),
                new SeedService("CRM / Business Systems", "Business Systems", "Lightweight CRM-style tools and internal management systems."),
                new SeedService("API Integration", "Integration", "Connections between business tools and external APIs."),
                new SeedService("Technical Consulting", "Consulting", "Technical planning and implementation support for small businesses.")
        );

        for (SeedService seed : services) {
            serviceRepository.findByNameIgnoreCase(seed.name()).orElseGet(() -> {
                ServiceEntity entity = new ServiceEntity();
                entity.setName(seed.name());
                entity.setCategory(seed.category());
                entity.setDescription(seed.description());
                entity.setActive(true);
                return serviceRepository.save(entity);
            });
        }
    }

    private record SeedService(String name, String category, String description) {}
}
