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
    /// Implementación del repositorio de mensajes de contacto
    /// </summary>
    public class ContactRepository : IContactRepository
    {
        private readonly ApplicationDbContext _context;

        public ContactRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ContactMessage>> GetAllMessagesAsync()
        {
            return await _context.ContactMessages
                .AsNoTracking()
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ContactMessage>> GetUnreadMessagesAsync()
        {
            return await _context.ContactMessages
                .Where(m => !m.IsRead)
                .AsNoTracking()
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<ContactMessage> GetMessageByIdAsync(int id)
        {
            return await _context.ContactMessages
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<ContactMessage> SaveMessageAsync(ContactMessage message)
        {
            message.CreatedAt = DateTime.UtcNow;
            await _context.ContactMessages.AddAsync(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task<bool> MarkAsReadAsync(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return false;

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> MarkAsRepliedAsync(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return false;

            message.IsReplied = true;
            message.RepliedAt = DateTime.UtcNow;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteMessageAsync(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return false;

            _context.ContactMessages.Remove(message);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

