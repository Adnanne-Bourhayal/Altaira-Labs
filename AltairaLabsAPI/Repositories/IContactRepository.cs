using System.Collections.Generic;
using System.Threading.Tasks;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Repositories
{
    /// <summary>
    /// Interfaz para el repositorio de mensajes de contacto
    /// </summary>
    public interface IContactRepository
    {
        /// <summary>
        /// Obtiene todos los mensajes de contacto
        /// </summary>
        Task<IEnumerable<ContactMessage>> GetAllMessagesAsync();

        /// <summary>
        /// Obtiene los mensajes no leídos
        /// </summary>
        Task<IEnumerable<ContactMessage>> GetUnreadMessagesAsync();

        /// <summary>
        /// Obtiene un mensaje por su ID
        /// </summary>
        Task<ContactMessage> GetMessageByIdAsync(int id);

        /// <summary>
        /// Guarda un nuevo mensaje de contacto
        /// </summary>
        Task<ContactMessage> SaveMessageAsync(ContactMessage message);

        /// <summary>
        /// Marca un mensaje como leído
        /// </summary>
        Task<bool> MarkAsReadAsync(int id);

        /// <summary>
        /// Marca un mensaje como respondido
        /// </summary>
        Task<bool> MarkAsRepliedAsync(int id);

        /// <summary>
        /// Elimina un mensaje
        /// </summary>
        Task<bool> DeleteMessageAsync(int id);
    }
}

