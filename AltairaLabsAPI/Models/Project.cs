using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AltairaLabsAPI.Models
{
    /// <summary>
    /// Representa un proyecto realizado por Altaira Labs
    /// </summary>
    public class Project
    {
        /// <summary>
        /// Identificador único del proyecto
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Título del proyecto
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Title { get; set; }

        /// <summary>
        /// Descripción breve del proyecto
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Descripción detallada del proyecto
        /// </summary>
        public string DetailedDescription { get; set; }

        /// <summary>
        /// Categoría del proyecto (AI Development, AI Automation, etc.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// URL de la imagen principal del proyecto
        /// </summary>
        [StringLength(255)]
        public string ImageUrl { get; set; }

        /// <summary>
        /// Fecha de inicio del proyecto
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Fecha de finalización del proyecto
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Indica si el proyecto está destacado
        /// </summary>
        public bool IsFeatured { get; set; } = false;

        /// <summary>
        /// Fecha de creación del registro
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Fecha de última actualización del registro
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Tecnologías utilizadas en el proyecto
        /// </summary>
        public virtual ICollection<ProjectTechnology> Technologies { get; set; }

        /// <summary>
        /// Resultados o logros del proyecto
        /// </summary>
        public virtual ICollection<ProjectResult> Results { get; set; }
    }

    /// <summary>
    /// Representa una tecnología utilizada en un proyecto
    /// </summary>
    public class ProjectTechnology
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Name { get; set; }
        
        public int ProjectId { get; set; }
        public virtual Project Project { get; set; }
    }

    /// <summary>
    /// Representa un resultado o logro de un proyecto
    /// </summary>
    public class ProjectResult
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Description { get; set; }
        
        public int ProjectId { get; set; }
        public virtual Project Project { get; set; }
    }
}

