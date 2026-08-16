package com.altaira.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class InternalApiTokenService {

    private final String internalApiToken;

    public InternalApiTokenService(@Value("${altaira.internal-api-token}") String internalApiToken) {
        this.internalApiToken = internalApiToken;
    }

    public void requireValidToken(String providedToken) {
        if (!isValidToken(providedToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API token");
        }
    }

    public boolean isValidToken(String providedToken) {
        if (providedToken == null || providedToken.isBlank() || internalApiToken == null || internalApiToken.isBlank()) {
            return false;
        }

        return MessageDigest.isEqual(
                providedToken.getBytes(StandardCharsets.UTF_8),
                internalApiToken.getBytes(StandardCharsets.UTF_8)
        );
    }
}
