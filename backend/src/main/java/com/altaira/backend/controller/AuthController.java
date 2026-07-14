package com.altaira.backend.controller;

import com.altaira.backend.dto.auth.AuthUserResponse;
import com.altaira.backend.dto.auth.LoginRequest;
import com.altaira.backend.dto.auth.LoginResponse;
import com.altaira.backend.security.RateLimiterService;
import com.altaira.backend.service.AuthService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;

    public AuthController(AuthService authService, RateLimiterService rateLimiterService) {
        this.authService = authService;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = resolveIpAddress(httpRequest);
        String username = request.getUsername() == null ? "" : request.getUsername().trim().toLowerCase();
        Bucket bucket = rateLimiterService.resolveLoginBucket(ipAddress + ":" + username);

        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Too many login attempts",
                    "message", "Please wait a few minutes before trying again."
            ));
        }

        LoginResponse response = authService.login(request, ipAddress, resolveUserAgent(httpRequest));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public AuthUserResponse me(
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String sessionToken
    ) {
        return authService.getCurrentUser(sessionToken);
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout(
            @RequestHeader(name = "X-Admin-Session-Token", required = false) String sessionToken,
            HttpServletRequest httpRequest
    ) {
        authService.logout(sessionToken, resolveIpAddress(httpRequest), resolveUserAgent(httpRequest));
        return Map.of("success", true);
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private String resolveUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
