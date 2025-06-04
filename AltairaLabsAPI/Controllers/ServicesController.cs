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
    public class ServicesController : ControllerBase
    {
        private readonly IServiceRepository _serviceRepository;

        public ServicesController(IServiceRepository serviceRepository)
        {
            _serviceRepository = serviceRepository;
        }

        /// <summary>
        /// Obtiene todos los servicios
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()
        {
            var services = await _serviceRepository.GetAllServicesAsync();
            return Ok(services);
        }

        /// <summary>
        /// Obtiene los servicios destacados
        /// </summary>
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<Service>>> GetFeaturedServices()
        {
            var services = await _serviceRepository.GetFeaturedServicesAsync();
            return Ok(services);
        }

        /// <summary>
        /// Obtiene un servicio por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Service>> GetService(int id)
        {
            var service = await _serviceRepository.GetServiceByIdAsync(id);
            
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            return Ok(service);
        }

        /// <summary>
        /// Obtiene servicios por categoría
        /// </summary>
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<Service>>> GetServicesByCategory(string category)
        {
            var services = await _serviceRepository.GetServicesByCategoryAsync(category);
            return Ok(services);
        }

        /// <summary>
        /// Crea un nuevo servicio
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Service>> CreateService([FromBody] Service service)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var createdService = await _serviceRepository.CreateServiceAsync(service);
            return CreatedAtAction(nameof(GetService), new { id = createdService.Id }, createdService);
        }

        /// <summary>
        /// Actualiza un servicio existente
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] Service service)
        {
            if (id != service.Id)
                return BadRequest(new { message = "ID no coincide" });
                
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var existingService = await _serviceRepository.GetServiceByIdAsync(id);
            if (existingService == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            var result = await _serviceRepository.UpdateServiceAsync(service);
            if (!result)
                return BadRequest(new { message = "Error al actualizar el servicio" });
                
            return NoContent();
        }

        /// <summary>
        /// Elimina un servicio
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            var service = await _serviceRepository.GetServiceByIdAsync(id);
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            var result = await _serviceRepository.DeleteServiceAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al eliminar el servicio" });
                
            return NoContent();
        }

        /// <summary>
        /// Añade una característica a un servicio
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{serviceId}/features")]
        public async Task<ActionResult<ServiceFeature>> AddServiceFeature(int serviceId, [FromBody] ServiceFeature feature)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var service = await _serviceRepository.GetServiceByIdAsync(serviceId);
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            feature.ServiceId = serviceId;
            var createdFeature = await _serviceRepository.AddServiceFeatureAsync(feature);
            
            return CreatedAtAction(nameof(GetService), new { id = serviceId }, createdFeature);
        }

        /// <summary>
        /// Añade un beneficio a un servicio
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{serviceId}/benefits")]
        public async Task<ActionResult<ServiceBenefit>> AddServiceBenefit(int serviceId, [FromBody] ServiceBenefit benefit)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var service = await _serviceRepository.GetServiceByIdAsync(serviceId);
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            benefit.ServiceId = serviceId;
            var createdBenefit = await _serviceRepository.AddServiceBenefitAsync(benefit);
            
            return CreatedAtAction(nameof(GetService), new { id = serviceId }, createdBenefit);
        }

        /// <summary>
        /// Añade un caso de estudio a un servicio
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{serviceId}/case-studies")]
        public async Task<ActionResult<CaseStudy>> AddCaseStudy(int serviceId, [FromBody] CaseStudy caseStudy)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var service = await _serviceRepository.GetServiceByIdAsync(serviceId);
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });
                
            caseStudy.ServiceId = serviceId;
            var createdCaseStudy = await _serviceRepository.AddCaseStudyAsync(caseStudy);
            
            return CreatedAtAction(nameof(GetService), new { id = serviceId }, createdCaseStudy);
        }
    }
}

```csharp file="AltairaLabsAPI/Controllers/ContactController.cs"
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
    public class ContactController : ControllerBase
    {
        private readonly IContactRepository _contactRepository;

        public ContactController(IContactRepository contactRepository)
        {
            _contactRepository = contactRepository;
        }

        /// <summary>
        /// Obtiene todos los mensajes de contacto (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContactMessage>>> GetAllMessages()
        {
            var messages = await _contactRepository.GetAllMessagesAsync();
            return Ok(messages);
        }

        /// <summary>
        /// Obtiene los mensajes no leídos (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("unread")]
        public async Task<ActionResult<IEnumerable<ContactMessage>>> GetUnreadMessages()
        {
            var messages = await _contactRepository.GetUnreadMessagesAsync();
            return Ok(messages);
        }

        /// <summary>
        /// Obtiene un mensaje por su ID (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<ContactMessage>> GetMessage(int id)
        {
            var message = await _contactRepository.GetMessageByIdAsync(id);
            
            if (message == null)
                return NotFound(new { message = "Mensaje no encontrado" });
                
            return Ok(message);
        }

        /// <summary>
        /// Envía un nuevo mensaje de contacto (acceso público)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ContactMessage message)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            // Capturar IP del cliente
            message.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            var savedMessage = await _contactRepository.SaveMessageAsync(message);
            return CreatedAtAction(nameof(GetMessage), new { id = savedMessage.Id }, savedMessage);
        }

        /// <summary>
        /// Marca un mensaje como leído (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var message = await _contactRepository.GetMessageByIdAsync(id);
            if (message == null)
                return NotFound(new { message = "Mensaje no encontrado" });
                
            var result = await _contactRepository.MarkAsReadAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al marcar el mensaje como leído" });
                
            return NoContent();
        }

        /// <summary>
        /// Marca un mensaje como respondido (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/replied")]
        public async Task<IActionResult> MarkAsReplied(int id)
        {
            var message = await _contactRepository.GetMessageByIdAsync(id);
            if (message == null)
                return NotFound(new { message = "Mensaje no encontrado" });
                
            var result = await _contactRepository.MarkAsRepliedAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al marcar el mensaje como respondido" });
                
            return NoContent();
        }

        /// <summary>
        /// Elimina un mensaje (solo administradores)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var message = await _contactRepository.GetMessageByIdAsync(id);
            if (message == null)
                return NotFound(new { message = "Mensaje no encontrado" });
                
            var result = await _contactRepository.DeleteMessageAsync(id);
            if (!result)
                return BadRequest(new { message = "Error al eliminar el mensaje" });
                
            return NoContent();
        }
    }
}

