using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AltairaLabsAPI.Models
{
    /// <summary>
    /// Representa un servicio ofrecido por Altaira Labs
    /// </summary>
    public class Service
    {
        /// <summary>
        /// Identificador único del servicio
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Nombre del servicio
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Descripción breve del servicio
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Descripción detallada del servicio
        /// </summary>
        [Required]
        public string DetailedDescription { get; set; }

        /// <summary>
        /// Categoría del servicio (AI Strategy, AI Development, etc.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// Icono asociado al servicio
        /// </summary>
        [StringLength(50)]
        public string Icon { get; set; }

        /// <summary>
        /// Precio base del servicio
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Indica si el servicio está destacado en la página principal
        /// </summary>
        public bool IsFeatured { get; set; }

        /// <summary>
        /// Orden de visualización del servicio
        /// </summary>
        public int DisplayOrder { get; set; }

        /// <summary>
        /// Fecha de creación del servicio
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Fecha de última actualización del servicio
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Características del servicio
        /// </summary>
        public virtual ICollection<ServiceFeature> Features { get; set; }

        /// <summary>
        /// Beneficios del servicio
        /// </summary>
        public virtual ICollection<ServiceBenefit> Benefits { get; set; }

        /// <summary>
        /// Casos de éxito relacionados con el servicio
        /// </summary>
        public virtual ICollection<CaseStudy> CaseStudies { get; set; }
    }

    /// <summary>
    /// Representa una característica específica de un servicio
    /// </summary>
    public class ServiceFeature
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Description { get; set; }
        
        public int ServiceId { get; set; }
        public virtual Service Service { get; set; }
    }

    /// <summary>
    /// Representa un beneficio específico de un servicio
    /// </summary>
    public class ServiceBenefit
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Description { get; set; }
        
        public int ServiceId { get; set; }
        public virtual Service Service { get; set; }
    }

    /// <summary>
    /// Representa un caso de éxito relacionado con un servicio
    /// </summary>
    public class CaseStudy
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; }
        
        public virtual ICollection<CaseStudyResult> Results { get; set; }
        
        public int ServiceId { get; set; }
        public virtual Service Service { get; set; }
    }

    /// <summary>
    /// Representa un resultado específico de un caso de éxito
    /// </summary>
    public class CaseStudyResult
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Description { get; set; }
        
        public int CaseStudyId { get; set; }
        public virtual CaseStudy CaseStudy { get; set; }
    }
}

