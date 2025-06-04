using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AltairaLabsAPI.Models
{
    /// <summary>
    /// Representa un usuario del sistema
    /// </summary>
    public class User
    {
        /// <summary>
        /// Identificador único del usuario
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Nombre completo del usuario
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Correo electrónico del usuario (usado como nombre de usuario)
        /// </summary>
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        /// <summary>
        /// Hash de la contraseña del usuario
        /// </summary>
        [Required]
        public string PasswordHash { get; set; }

        /// <summary>
        /// Rol del usuario en el sistema
        /// </summary>
        [Required]
        public string Role { get; set; } = "User";

        /// <summary>
        /// Fecha de creación de la cuenta
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Fecha de última actualización de la cuenta
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Indica si la cuenta está activa
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Colección de tokens de actualización asociados al usuario
        /// </summary>
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
    }

    /// <summary>
    /// Representa un token de actualización para la autenticación JWT
    /// </summary>
    public class RefreshToken
    {
        public int Id { get; set; }
        public string Token { get; set; }
        public DateTime Expires { get; set; }
        public bool IsExpired => DateTime.UtcNow >= Expires;
        public DateTime Created { get; set; }
        public string CreatedByIp { get; set; }
        public DateTime? Revoked { get; set; }
        public string RevokedByIp { get; set; }
        public string ReplacedByToken { get; set; }
        public bool IsActive => Revoked == null && !IsExpired;
        public int UserId { get; set; }
        public virtual User User { get; set; }
    }
}

