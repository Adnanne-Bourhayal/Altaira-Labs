using System;
using System.ComponentModel.DataAnnotations;

namespace AltairaLabsAPI.Models
{
    /// <summary>
    /// Representa un mensaje de contacto enviado por un usuario
    /// </summary>
    public class ContactMessage
    {
        /// <summary>
        /// Identificador único del mensaje
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Nombre de la persona que envía el mensaje
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Correo electrónico de la persona que envía el mensaje
        /// </summary>
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        /// <summary>
        /// Empresa de la persona que envía el mensaje
        /// </summary>
        [StringLength(100)]
        public string Company { get; set; }

        /// <summary>
        /// Número de teléfono de la persona que envía el mensaje
        /// </summary>
        [StringLength(20)]
        public string Phone { get; set; }

        /// <summary>
        /// Contenido del mensaje
        /// </summary>
        [Required]
        [StringLength(2000)]
        public string Message { get; set; }

        /// <summary>
        /// Tipo de servicio de interés
        /// </summary>
        [StringLength(50)]
        public string ServiceInterest { get; set; }

        /// <summary>
        /// Fecha de envío del mensaje
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Indica si el mensaje ha sido leído
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// Fecha en que se leyó el mensaje
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Indica si se ha respondido al mensaje
        /// </summary>
        public bool IsReplied { get; set; } = false;

        /// <summary>
        /// Fecha en que se respondió al mensaje
        /// </summary>
        public DateTime? RepliedAt { get; set; }

        /// <summary>
        /// Dirección IP del remitente
        /// </summary>
        [StringLength(50)]
        public string IpAddress { get; set; }
    }
}

