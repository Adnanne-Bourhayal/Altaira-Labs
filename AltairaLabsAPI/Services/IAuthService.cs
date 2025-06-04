using System.Threading.Tasks;
using AltairaLabsAPI.Models;
using AltairaLabsAPI.DTOs;

namespace AltairaLabsAPI.Services
{
    /// <summary>
    /// Interfaz para el servicio de autenticación
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Registra un nuevo usuario
        /// </summary>
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto, string ipAddress);

        /// <summary>
        /// Autentica a un usuario
        /// </summary>
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto, string ipAddress);

        /// <summary>
        /// Refresca el token de acceso
        /// </summary>
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string ipAddress);

        /// <summary>
        /// Revoca un token de actualización
        /// </summary>
        Task<bool> RevokeTokenAsync(string token, string ipAddress);

        /// <summary>
        /// Verifica si un token es válido
        /// </summary>
        Task<bool> ValidateTokenAsync(string token);
    }
}

