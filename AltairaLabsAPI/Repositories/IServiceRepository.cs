using System.Collections.Generic;
using System.Threading.Tasks;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Repositories
{
    /// <summary>
    /// Interfaz para el repositorio de servicios
    /// </summary>
    public interface IServiceRepository
    {
        /// <summary>
        /// Obtiene todos los servicios
        /// </summary>
        Task<IEnumerable<Service>> GetAllServicesAsync();

        /// <summary>
        /// Obtiene los servicios destacados
        /// </summary>
        Task<IEnumerable<Service>> GetFeaturedServicesAsync();

        /// <summary>
        /// Obtiene un servicio por su ID
        /// </summary>
        Task<Service> GetServiceByIdAsync(int id);

        /// <summary>
        /// Obtiene servicios por categoría
        /// </summary>
        Task<IEnumerable<Service>> GetServicesByCategoryAsync(string category);

        /// <summary>
        /// Crea un nuevo servicio
        /// </summary>
        Task<Service> CreateServiceAsync(Service service);

        /// <summary>
        /// Actualiza un servicio existente
        /// </summary>
        Task<bool> UpdateServiceAsync(Service service);

        /// <summary>
        /// Elimina un servicio
        /// </summary>
        Task<bool> DeleteServiceAsync(int id);

        /// <summary>
        /// Añade una característica a un servicio
        /// </summary>
        Task<ServiceFeature> AddServiceFeatureAsync(ServiceFeature feature);

        /// <summary>
        /// Añade un beneficio a un servicio
        /// </summary>
        Task<ServiceBenefit> AddServiceBenefitAsync(ServiceBenefit benefit);

        /// <summary>
        /// Añade un caso de estudio a un servicio
        /// </summary>
        Task<CaseStudy> AddCaseStudyAsync(CaseStudy caseStudy);
    }
}

