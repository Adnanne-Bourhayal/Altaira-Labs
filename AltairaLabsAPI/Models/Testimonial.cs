using System;
using System.ComponentModel.DataAnnotations;

namespace AltairaLabsAPI.Models
{
    /// <summary>
    /// Representa un testimonio de un cliente
    /// </summary>
    public class Testimonial
    {
        /// <summary>
        /// Identificador único del testimonio
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Contenido del testimonio
        /// </summary>
        [Required]
        [StringLength(1000)]
        public string Content { get; set; }

        /// <summary>
        /// Nombre del autor del testimonio
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Author { get; set; }

        /// <summary>
        /// Cargo o posición del autor
        /// </summary>
        [StringLength(100)]
        public string Position { get; set; }

        /// <summary>
        /// Empresa del autor
        /// </summary>
        [StringLength(100)]
        public string Company { get; set; }

        /// <summary>
        /// URL de la imagen del autor
        /// </summary>
        [StringLength(255)]
        public string ImageUrl { get; set; }

        /// <summary>
        /// Valoración (de 1 a 5)
        /// </summary>
        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        /// <summary>
        /// Indica si el testimonio está aprobado para mostrarse
        /// </summary>
        public bool IsApproved { get; set; } = false;

        /// <summary>
        /// Indica si el testimonio está destacado
        /// </summary>
        public bool IsFeatured { get; set; } = false;

        /// <summary>
        /// Fecha de creación del testimonio
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Fecha de aprobación del testimonio
        /// </summary>
        public DateTime? ApprovedAt { get; set; }
    }
}

