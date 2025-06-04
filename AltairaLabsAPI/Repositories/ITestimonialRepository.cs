using System.Collections.Generic;
using System.Threading.Tasks;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Repositories
{
    /// <summary>
    /// Interfaz para el repositorio de testimonios
    /// </summary>
    public interface ITestimonialRepository
    {
        /// <summary>
        /// Obtiene todos los testimonios
        /// </summary>
        Task<IEnumerable<Testimonial>> GetAllTestimonialsAsync();

        /// <summary>
        /// Obtiene los testimonios aprobados
        /// </summary>
        Task<IEnumerable<Testimonial>> GetApprovedTestimonialsAsync();

        /// <summary>
        /// Obtiene los testimonios destacados
        /// </summary>
        Task<IEnumerable<Testimonial>> GetFeaturedTestimonialsAsync();

        /// <summary>
        /// Obtiene un testimonio por su ID
        /// </summary>
        Task<Testimonial> GetTestimonialByIdAsync(int id);

        /// <summary>
        /// Crea un nuevo testimonio
        /// </summary>
        Task<Testimonial> CreateTestimonialAsync(Testimonial testimonial);

        /// <summary>
        /// Actualiza un testimonio existente
        /// </summary>
        Task<bool> UpdateTestimonialAsync(Testimonial testimonial);

        /// <summary>
        /// Aprueba un testimonio
        /// </summary>
        Task<bool> ApproveTestimonialAsync(int id);

        /// <summary>
        /// Destaca un testimonio
        /// </summary>
        Task<bool> FeatureTestimonialAsync(int id, bool isFeatured);

        /// <summary>
        /// Elimina un testimonio
        /// </summary>
        Task<bool> DeleteTestimonialAsync(int id);
    }
}

