package com.altairalabs.api.controller;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.altairalabs.api.dto.AuthResponseDto;
import com.altairalabs.api.dto.LoginDto;
import com.altairalabs.api.dto.RegisterDto;
import com.altairalabs.api.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    /**
     * Registra un nuevo usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDto registerDto, HttpServletRequest request, HttpServletResponse response) {
        String ipAddress = getClientIp(request);
        AuthResponseDto result = authService.register(registerDto, ipAddress);
        
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(result);
        }
        
        setRefreshTokenCookie(response, result.getRefreshToken());
        return ResponseEntity.ok(result);
    }
    
    /**
     * Inicia sesión con un usuario existente
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto, HttpServletRequest request, HttpServletResponse response) {
        String ipAddress = getClientIp(request);
        AuthResponseDto result = authService.login(loginDto, ipAddress);
        
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(result);
        }
        
        setRefreshTokenCookie(response, result.getRefreshToken());
        return ResponseEntity.ok(result);
    }
    
    /**
     * Refresca el token de acceso
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getRefreshTokenFromCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(new AuthResponseDto(false, "Token no proporcionado", null, null, null));
        }
        
        String ipAddress = getClientIp(request);
        AuthResponseDto result = authService.refreshToken(refreshToken, ipAddress);
        
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(result);
        }
        
        setRefreshTokenCookie(response, result.getRefreshToken());
        return ResponseEntity.ok(result);
    }
    
    /**
     * Cierra la sesión del usuario
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getRefreshTokenFromCookie(request);
        if (refreshToken != null) {
            String ipAddress = getClientIp(request);
            authService.revokeToken(refreshToken, ipAddress);
        }
        
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        
        return ResponseEntity.ok().body(new AuthResponseDto(true, "Sesión cerrada correctamente", null, null, null));
    }
    
    /**
     * Obtiene la IP del cliente
     */
    private String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }
    
    /**
     * Establece la cookie del refresh token
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 días
        response.addCookie(cookie);
    }
    
    /**
     * Obtiene el refresh token de la cookie
     */
    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

