package com.altaira.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InternalApiTokenService {

    private final String internalApiToken;

    public InternalApiTokenService(@Value("${altaira.internal-api-token}") String internalApiToken) {
        this.internalApiToken = internalApiToken;
    }

    public void requireValidToken(String providedToken) {
        if (providedToken == null || providedToken.isBlank() || !providedToken.equals(internalApiToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API token");
        }
    }
}
