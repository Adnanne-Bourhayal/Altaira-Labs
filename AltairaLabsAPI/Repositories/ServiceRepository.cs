using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AltairaLabsAPI.Data;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Repositories
{
    /// <summary>
    /// Implementación del repositorio de servicios
    /// </summary>
    public class ServiceRepository : IServiceRepository
    {
        private readonly ApplicationDbContext _context;

        public ServiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Service>> GetAllServicesAsync()
        {
            return await _context.Services
                .Include(s => s.Features)
                .Include(s => s.Benefits)
                .Include(s => s.CaseStudies)
                    .ThenInclude(cs => cs.Results)
                .AsNoTracking()
                .OrderBy(s => s.DisplayOrder)
                .ToListAsync();
        }

        public async Task<IEnumerable<Service>> GetFeaturedServicesAsync()
        {
            return await _context.Services
                .Include(s => s.Features)
                .Include(s => s.Benefits)
                .Where(s => s.IsFeatured)
                .AsNoTracking()
                .OrderBy(s => s.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Service> GetServiceByIdAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Features)
                .Include(s => s.Benefits)
                .Include(s => s.CaseStudies)
                    .ThenInclude(cs => cs.Results)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<Service>> GetServicesByCategoryAsync(string category)
        {
            return await _context.Services
                .Include(s => s.Features)
                .Include(s => s.Benefits)
                .Where(s => s.Category == category)
                .AsNoTracking()
                .OrderBy(s => s.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Service> CreateServiceAsync(Service service)
        {
            service.CreatedAt = DateTime.UtcNow;
            await _context.Services.AddAsync(service);
            await _context.SaveChangesAsync();
            return service;
        }

        public async Task<bool> UpdateServiceAsync(Service service)
        {
            service.UpdatedAt = DateTime.UtcNow;
            _context.Services.Update(service);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteServiceAsync(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null)
                return false;

            _context.Services.Remove(service);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<ServiceFeature> AddServiceFeatureAsync(ServiceFeature feature)
        {
            await _context.ServiceFeatures.AddAsync(feature);
            await _context.SaveChangesAsync();
            return feature;
        }

        public async Task<ServiceBenefit> AddServiceBenefitAsync(ServiceBenefit benefit)
        {
            await _context.ServiceBenefits.AddAsync(benefit);
            await _context.SaveChangesAsync();
            return benefit;
        }

        public async Task<CaseStudy> AddCaseStudyAsync(CaseStudy caseStudy)
        {
            await _context.CaseStudies.AddAsync(caseStudy);
            await _context.SaveChangesAsync();
            return caseStudy;
        }
    }
}

