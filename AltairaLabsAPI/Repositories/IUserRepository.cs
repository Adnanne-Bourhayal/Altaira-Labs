using System.Collections.Generic;
using System.Threading.Tasks;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Repositories
{
    /// <summary>
    /// Interfaz para el repositorio de usuarios
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Obtiene todos los usuarios
        /// </summary>
        Task<IEnumerable<User>> GetAllUsersAsync();

        /// <summary>
        /// Obtiene un usuario por su ID
        /// </summary>
        Task<User> GetUserByIdAsync(int id);

        /// <summary>
        /// Obtiene un usuario por su email
        /// </summary>
        Task<User> GetUserByEmailAsync(string email);

        /// <summary>
        /// Crea un nuevo usuario
        /// </summary>
        Task<User> CreateUserAsync(User user);

        /// <summary>
        /// Actualiza un usuario existente
        /// </summary>
        Task<bool> UpdateUserAsync(User user);

        /// <summary>
        /// Elimina un usuario
        /// </summary>
        Task<bool> DeleteUserAsync(int id);

        /// <summary>
        /// Verifica si un email ya está registrado
        /// </summary>
        Task<bool> EmailExistsAsync(string email);

        /// <summary>
        /// Guarda un token de actualización
        /// </summary>
        Task SaveRefreshTokenAsync(RefreshToken token);

        /// <summary>
        /// Obtiene un token de actualización por su valor
        /// </summary>
        Task<RefreshToken> GetRefreshTokenAsync(string token);

        /// <summary>
        /// Revoca todos los tokens de un usuario
        /// </summary>
        Task RevokeAllUserTokensAsync(int userId, string ipAddress);
    }
}

