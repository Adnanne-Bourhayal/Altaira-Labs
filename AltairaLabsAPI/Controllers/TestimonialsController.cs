using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AltairaLabsAPI.Models;
using AltairaLabsAPI.Repositories;

namespace AltairaLabsAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestimonialsController : ControllerBase
    {
        private readonly ITestimonialRepository _testimonialRepository;

        public TestimonialsController(ITestimonialRepository testimonialRepository)
        {
            _testimonialRepository = testimonialRepository;
        }

        /// <summary>
        /// Obtiene todos los testimonios (solo administradores ven los no aprobados)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Testimonial>>> GetTestimonials()
        {
            // Si es admin, muestra todos los testimonios
            if (User.IsInRole("Admin"))
            {
                var allTestimonials = await _testimonialRepository.GetAllTestimonialsAsync();
                return Ok(allTestimonials);
            }
            
            // Si no es admin, solo muestra los aprobados
            var approvedTestimonials = await _testimonialRepository.GetApprovedTestimonialsAsync();
            return Ok(approvedTestimonials);
        }

        /// <summary>
        /// Obtiene los testimonios destacados
        /// </summary>
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<Testimonial>>> GetFeaturedTestimonials()
        {
            var testimonials = await _testimonialRepository.GetFeaturedTestimonialsAsync();
            return Ok(testimonials);
        }

        /// <summary>
        /// Obtiene un testimonio por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Testimonial>> GetTestimonial(int id)
        {
            var testimonial = await _testimonialRepository.GetTestimonialByIdAsync(id);
            
            if (testimonial == null)
                return NotFound(new { message = "Testimonio no encontrado" });
                
            // Si no está aprobado y el usuario no es admin, no mostrar
            if (!testimonial.IsApproved && !User.IsInRole("Admin"))
                return NotFound(new { message = "Testimonio no encontrado" });
                
            return Ok(testimonial);
        }

        /// <summary>
        /// Crea un nuevo testimonio (acceso público)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Testimonial>> CreateTestimonial([FromBody] Testimonial testimonial)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            // Los testimonios creados por usuarios normales requieren aprobación
            if (!User.IsInRole("Admin"))
            {
                testimonial.IsApproved = false;
                testimonial.IsFeatured = false;
            }
            
            var createdTestimonial = await _testimonialRepository.CreateTestimonialAsync(testimonial);
            return CreatedAtAction(nameof(GetTestimonial), new { id = createdTestimonial.Id }, createdTestimonial);
        }

        /// <summary>
        /// Actualiza un testimonio existente (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTestimonial(int id, [FromBody] Testimonial testimonial)
        {
            if (id != testimonial.Id)
                return BadRequest(new { message = "ID no coincide" });
                
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var existingTestimonial = await _testimonialRepository.GetTestimonialByIdAsync(id);
            if (existingTestimonial == null)
                return NotFound(new { message = "Testimonio no encontrado" });
                
            var result = await _testimonialRepository.UpdateTestimonialAsync(testimonial);
            if (!result)
                return BadRequest(new { message = "Error al actualizar el testimonio" });
                
            return NoContent();
        }

        /// <summary>
        /// Aprueba un testimonio (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveTestimonial(int id)
        {
            var testimonial = await _testimonialRepository.GetTestimonialByIdAsync(id);
            if (testimonial == null)
                return NotFound(new { message = "Testimonio no encontrado" });
                
            var result = await _testimonialRepository.ApproveTestimonialAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al aprobar el testimonio" });
                
            return NoContent();
        }

        /// <summary>
        /// Destaca o quita el destacado de un testimonio (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/feature")]
        public async Task<IActionResult> FeatureTestimonial(int id, [FromQuery] bool featured = true)
        {
            var testimonial = await _testimonialRepository.GetTestimonialByIdAsync(id);
            if (testimonial == null)
                return NotFound(new { message = "Testimonio no encontrado" });
                
            var result = await _testimonialRepository.FeatureTestimonialAsync(id, featured);
            if (!result)
                return BadRequest(new { message = "Error al destacar/quitar destacado del testimonio" });
                
            return NoContent();
        }

        /// <summary>
        /// Elimina un testimonio (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTestimonial(int id)
        {
            var testimonial = await _testimonialRepository.GetTestimonialByIdAsync(id);
            if (testimonial == null)
                return NotFound(new { message = "Testimonio no encontrado" });
                
            var result = await _testimonialRepository.DeleteTestimonialAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al eliminar el testimonio" });
                
            return NoContent();
        }
    }
}

