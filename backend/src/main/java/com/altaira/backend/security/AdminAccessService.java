package com.altaira.backend.security;

import com.altaira.backend.service.AuthService;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.model.UserRole;
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

    public AppUserEntity requireAdminAccess(String internalApiToken, String adminSessionToken) {
        if (internalApiTokenService.isValidToken(internalApiToken)) {
            return null;
        }

        try {
            var user = authService.getCurrentUserEntity(adminSessionToken);
            UserRole role = UserRole.parse(user.getRole());
            if (!role.isAdminRole()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
            }
            return user;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized admin access");
        }
    }
}
