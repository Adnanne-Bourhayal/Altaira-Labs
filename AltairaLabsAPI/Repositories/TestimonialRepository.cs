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
    /// Implementación del repositorio de testimonios
    /// </summary>
    public class TestimonialRepository : ITestimonialRepository
    {
        private readonly ApplicationDbContext _context;

        public TestimonialRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Testimonial>> GetAllTestimonialsAsync()
        {
            return await _context.Testimonials
                .AsNoTracking()
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Testimonial>> GetApprovedTestimonialsAsync()
        {
            return await _context.Testimonials
                .Where(t => t.IsApproved)
                .AsNoTracking()
                .OrderByDescending(t => t.ApprovedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Testimonial>> GetFeaturedTestimonialsAsync()
        {
            return await _context.Testimonials
                .Where(t => t.IsApproved && t.IsFeatured)
                .AsNoTracking()
                .OrderByDescending(t => t.ApprovedAt)
                .ToListAsync();
        }

        public async Task<Testimonial> GetTestimonialByIdAsync(int id)
        {
            return await _context.Testimonials
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Testimonial> CreateTestimonialAsync(Testimonial testimonial)
        {
            testimonial.CreatedAt = DateTime.UtcNow;
            await _context.Testimonials.AddAsync(testimonial);
            await _context.SaveChangesAsync();
            return testimonial;
        }

        public async Task<bool> UpdateTestimonialAsync(Testimonial testimonial)
        {
            _context.Testimonials.Update(testimonial);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> ApproveTestimonialAsync(int id)
        {
            var testimonial = await _context.Testimonials.FindAsync(id);
            if (testimonial == null)
                return false;

            testimonial.IsApproved = true;
            testimonial.ApprovedAt = DateTime.UtcNow;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> FeatureTestimonialAsync(int id, bool isFeatured)
        {
            var testimonial = await _context.Testimonials.FindAsync(id);
            if (testimonial == null)
                return false;

            testimonial.IsFeatured = isFeatured;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteTestimonialAsync(int id)
        {
            var testimonial = await _context.Testimonials.FindAsync(id);
            if (testimonial == null)
                return false;

            _context.Testimonials.Remove(testimonial);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

