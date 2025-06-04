using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AltairaLabsAPI.Models;
using AltairaLabsAPI.Repositories;
using AltairaLabsAPI.DTOs;
using BC = BCrypt.Net.BCrypt;

namespace AltairaLabsAPI.Services
{
    /// <summary>
    /// Implementación del servicio de autenticación
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto, string ipAddress)
        {
            // Verificar si el email ya existe
            if (await _userRepository.EmailExistsAsync(registerDto.Email))
            {
                return new AuthResponseDto { Success = false, Message = "El email ya está registrado" };
            }

            // Crear el usuario
            var user = new User
            {
                Name = registerDto.Name,
                Email = registerDto.Email,
                PasswordHash = BC.HashPassword(registerDto.Password),
                Role = "User"
            };

            await _userRepository.CreateUserAsync(user);

            // Generar tokens
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(ipAddress);

            // Guardar refresh token
            refreshToken.UserId = user.Id;
            await _userRepository.SaveRefreshTokenAsync(refreshToken);

            return new AuthResponseDto
            {
                Success = true,
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                User = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role
                }
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto, string ipAddress)
        {
            // Buscar usuario por email
            var user = await _userRepository.GetUserByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return new AuthResponseDto { Success = false, Message = "Usuario o contraseña incorrectos" };
            }

            // Verificar contraseña
            if (!BC.Verify(loginDto.Password, user.PasswordHash))
            {
                return new AuthResponseDto { Success = false, Message = "Usuario o contraseña incorrectos" };
            }

            // Verificar si la cuenta está activa
            if (!user.IsActive)
            {
                return new AuthResponseDto { Success = false, Message = "La cuenta está desactivada" };
            }

            // Generar tokens
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken(ipAddress);

            // Guardar refresh token
            refreshToken.UserId = user.Id;
            await _userRepository.SaveRefreshTokenAsync(refreshToken);

            return new AuthResponseDto
            {
                Success = true,
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                User = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role
                }
            };
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string ipAddress)
        {
            var token = await _userRepository.GetRefreshTokenAsync(refreshToken);
            if (token == null || !token.IsActive)
            {
                return new AuthResponseDto { Success = false, Message = "Token inválido o expirado" };
            }

            // Generar nuevo refresh token
            var newRefreshToken = GenerateRefreshToken(ipAddress);
            
            // Revocar token actual
            token.Revoked = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
            token.ReplacedByToken = newRefreshToken.Token;
            
            // Guardar nuevo token
            newRefreshToken.UserId = token.UserId;
            await _userRepository.SaveRefreshTokenAsync(newRefreshToken);

            // Generar nuevo JWT
            var jwtToken = GenerateJwtToken(token.User);

            return new AuthResponseDto
            {
                Success = true,
                Token = jwtToken,
                RefreshToken = newRefreshToken.Token,
                User = new UserDto
                {
                    Id = token.User.Id,
                    Name = token.User.Name,
                    Email = token.User.Email,
                    Role = token.User.Role
                }
            };
        }

        public async Task<bool> RevokeTokenAsync(string token, string ipAddress)
        {
            var refreshToken = await _userRepository.GetRefreshTokenAsync(token);
            if (refreshToken == null || !refreshToken.IsActive)
            {
                return false;
            }

            // Revocar token
            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            
            await _userRepository.UpdateUserAsync(refreshToken.User);
            return true;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private RefreshToken GenerateRefreshToken(string ipAddress)
        {
            using var rng = RandomNumberGenerator.Create();
            var randomBytes = new byte[64];
            rng.GetBytes(randomBytes);

            return new RefreshToken
            {
                Token = Convert.ToBase64String(randomBytes),
                Expires = DateTime.UtcNow.AddDays(7),
                Created = DateTime.UtcNow,
                CreatedByIp = ipAddress
            };
        }
    }
}

