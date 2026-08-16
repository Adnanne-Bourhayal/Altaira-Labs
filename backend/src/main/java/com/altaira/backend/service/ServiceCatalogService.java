package com.altaira.backend.service;

import com.altaira.backend.dto.service.CreateServiceRequest;
import com.altaira.backend.dto.service.ServiceResponse;
import com.altaira.backend.dto.service.UpdateServiceRequest;
import com.altaira.backend.entity.ServiceEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class ServiceCatalogService {

    private static final Map<String, String> SERVICE_NAME_BY_MODULE_KEY = Map.of(
            "web_seo", "Website Development",
            "booking", "Booking Systems",
            "crm", "CRM / Business Systems",
            "automation", "Automation Workflows",
            "dashboard", "Internal Dashboards"
    );

    private final ServiceRepository serviceRepository;

    public ServiceCatalogService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public ServiceResponse createService(CreateServiceRequest request) {
        ServiceEntity entity = new ServiceEntity();
        entity.setName(trimRequired(request.getName()));
        entity.setCategory(trimOptional(request.getCategory()));
        entity.setDescription(trimOptional(request.getDescription()));
        entity.setActive(request.getActive() == null || request.getActive());

        return map(serviceRepository.save(entity));
    }

    public List<ServiceResponse> getAllServices() {
        return serviceRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::map)
                .toList();
    }

    public ServiceResponse getServiceById(UUID id) {
        return map(findServiceEntity(id));
    }

    public ServiceResponse updateService(UUID id, UpdateServiceRequest request) {
        ServiceEntity entity = findServiceEntity(id);
        entity.setName(trimRequired(request.getName()));
        entity.setCategory(trimOptional(request.getCategory()));
        entity.setDescription(trimOptional(request.getDescription()));

        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }

        return map(serviceRepository.save(entity));
    }

    ServiceEntity findServiceEntity(UUID id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
    }

    public ServiceEntity findServiceForModuleKey(String moduleKey) {
        String serviceName = SERVICE_NAME_BY_MODULE_KEY.get(moduleKey);
        if (serviceName == null) {
            throw new IllegalArgumentException("Unsupported launch service key");
        }

        ServiceEntity service = serviceRepository.findByNameIgnoreCase(serviceName)
                .orElseThrow(() -> new IllegalStateException(
                        "Required service catalogue entry is missing: " + serviceName
                ));

        if (!service.isActive()) {
            throw new IllegalStateException("Required service catalogue entry is inactive: " + serviceName);
        }
        return service;
    }

    ServiceResponse map(ServiceEntity entity) {
        return new ServiceResponse(
                entity.getId(),
                entity.getName(),
                entity.getCategory(),
                entity.getDescription(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String trimRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimOptional(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.trim();
    }
}
