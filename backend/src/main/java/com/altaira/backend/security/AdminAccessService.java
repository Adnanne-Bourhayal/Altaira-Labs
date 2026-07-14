package com.altaira.backend.security;

import com.altaira.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminAccessService {

    private final InternalApiTokenService internalApiTokenService;
    private final AuthService authService;

    public AdminAccessService(InternalApiTokenService internalApiTokenService, AuthService authService) {
        this.internalApiTokenService = internalApiTokenService;
        this.authService = authService;
    }

    public void requireAdminAccess(String internalApiToken, String adminSessionToken) {
        if (internalApiTokenService.isValidToken(internalApiToken)) {
            return;
        }

        try {
            authService.getCurrentUser(adminSessionToken);
        } catch (ResponseStatusException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized admin access");
        }
    }
}
