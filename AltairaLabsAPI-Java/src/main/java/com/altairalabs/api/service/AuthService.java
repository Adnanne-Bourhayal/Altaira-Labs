package com.altairalabs.api.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.altairalabs.api.dto.AuthResponseDto;
import com.altairalabs.api.dto.LoginDto;
import com.altairalabs.api.dto.RegisterDto;
import com.altairalabs.api.dto.UserDto;
import com.altairalabs.api.model.RefreshToken;
import com.altairalabs.api.model.User;
import com.altairalabs.api.repository.UserRepository;
import com.altairalabs.api.security.JwtTokenProvider;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Value("${app.jwt.refresh-token-expiration-days}")
    private int refreshTokenExpirationDays;
    
    /**
     * Registra un nuevo usuario
     */
    public AuthResponseDto register(RegisterDto registerDto, String ipAddress) {
        // Verificar si el email ya existe
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            return new AuthResponseDto(false, "El email ya está registrado", null, null, null);
        }
        
        // Crear el usuario
        User user = new User();
        user.setName(registerDto.getName());
        user.setEmail(registerDto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerDto.getPassword()));
        user.setRole("USER");
        
        userRepository.save(user);
        
        // Generar tokens
        String jwtToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = generateRefreshToken(user, ipAddress);
        
        return new AuthResponseDto(
            true,
            "Usuario registrado correctamente",
            jwtToken,
            refreshToken.getToken(),
            new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole())
        );
    }
    
    /**
     * Inicia sesión con un usuario existente
     */
    public AuthResponseDto login(LoginDto loginDto, String ipAddress) {
        // Buscar usuario por email
        User user = userRepository.findByEmail(loginDto.getEmail())
            .orElse(null);
        
        if (user == null) {
            return new AuthResponseDto(false, "Usuario o contraseña incorrectos", null, null, null);
        }
        
        // Verificar contraseña
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPasswordHash())) {
            return new AuthResponseDto(false, "Usuario o contraseña incorrectos", null, null, null);
        }
        
        // Verificar si la cuenta está activa
        if (!user.isActive()) {
            return new AuthResponseDto(false, "La cuenta está desactivada", null, null, null);
        }
        
        // Generar tokens
        String jwtToken = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = generateRefreshToken(user, ipAddress);
        
        return new AuthResponseDto(
            true,
            "Inicio de sesión exitoso",
            jwtToken,
            refreshToken.getToken(),
            new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole())
        );
    }
    
    /**
     * Refresca el token de acceso
     */
    public AuthResponseDto refreshToken(String token, String ipAddress) {
        RefreshToken refreshToken = userRepository.findByRefreshToken(token)
            .orElse(null);
        
        if (refreshToken == null || !refreshToken.isActive()) {
            return new AuthResponseDto(false, "Token inválido o expirado", null, null, null);
        }
        
        User user = refreshToken.getUser();
        
        // Revocar token actual
        refreshToken.setRevoked(LocalDateTime.now());
        refreshToken.setRevokedByIp(ipAddress);
        
        // Generar nuevo token
        RefreshToken newRefreshToken = generateRefreshToken(user, ipAddress);
        refreshToken.setReplacedByToken(newRefreshToken.getToken());
        
        userRepository.save(user);
        
        // Generar nuevo JWT
        String jwtToken = jwtTokenProvider.generateToken(user);
        
        return new AuthResponseDto(
            true,
            "Token actualizado correctamente",
            jwtToken,
            newRefreshToken.getToken(),
            new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole())
        );
    }
    
    /**
     * Revoca un token de actualización
     */
    public boolean revokeToken(String token, String ipAddress) {
        RefreshToken refreshToken = userRepository.findByRefreshToken(token)
            .orElse(null);
        
        if (refreshToken == null || !refreshToken.isActive()) {
            return false;
        }
        
        refreshToken.setRevoked(LocalDateTime.now());
        refreshToken.setRevokedByIp(ipAddress);
        
        userRepository.save(refreshToken.getUser());
        return true;
    }
    
    /**
     * Genera un token de actualización
     */
    private RefreshToken generateRefreshToken(User user, String ipAddress) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(generateRandomToken());
        refreshToken.setExpires(LocalDateTime.now().plusDays(refreshTokenExpirationDays));
        refreshToken.setCreated(LocalDateTime.now());
        refreshToken.setCreatedByIp(ipAddress);
        
        user.getRefreshTokens().add(refreshToken);
        return refreshToken;
    }
    
    /**
     * Genera un token aleatorio
     */
    private String generateRandomToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[64];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

