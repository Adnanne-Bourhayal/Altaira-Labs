package com.altaira.backend.controller;

import com.altaira.backend.dto.service.CreateServiceRequest;
import com.altaira.backend.dto.service.ServiceResponse;
import com.altaira.backend.dto.service.UpdateServiceRequest;
import com.altaira.backend.security.InternalApiTokenService;
import com.altaira.backend.service.ServiceCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/services")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;
    private final InternalApiTokenService internalApiTokenService;

    public ServiceCatalogController(ServiceCatalogService serviceCatalogService, InternalApiTokenService internalApiTokenService) {
        this.serviceCatalogService = serviceCatalogService;
        this.internalApiTokenService = internalApiTokenService;
    }

    @GetMapping
    public List<ServiceResponse> getAllServices(
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return serviceCatalogService.getAllServices();
    }

    @GetMapping("/{id}")
    public ServiceResponse getServiceById(
            @PathVariable UUID id,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return serviceCatalogService.getServiceById(id);
    }

    @PostMapping
    public ResponseEntity<ServiceResponse> createService(
            @Valid @RequestBody CreateServiceRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceCatalogService.createService(request));
    }

    @PatchMapping("/{id}")
    public ServiceResponse updateService(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateServiceRequest request,
            @RequestHeader(name = "X-Internal-API-Token", required = false) String internalApiToken
    ) {
        internalApiTokenService.requireValidToken(internalApiToken);
        return serviceCatalogService.updateService(id, request);
    }
}
