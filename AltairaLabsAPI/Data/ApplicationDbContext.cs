using Microsoft.EntityFrameworkCore;
using AltairaLabsAPI.Models;

namespace AltairaLabsAPI.Data
{
    /// <summary>
    /// Contexto de base de datos para la aplicación
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<ServiceFeature> ServiceFeatures { get; set; }
        public DbSet<ServiceBenefit> ServiceBenefits { get; set; }
        public DbSet<CaseStudy> CaseStudies { get; set; }
        public DbSet<CaseStudyResult> CaseStudyResults { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<ContactMessage> ContactMessages { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTechnology> ProjectTechnologies { get; set; }
        public DbSet<ProjectResult> ProjectResults { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de relaciones y restricciones

            // User - RefreshToken (1:N)
            modelBuilder.Entity<User>()
                .HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Service - ServiceFeature (1:N)
            modelBuilder.Entity<Service>()
                .HasMany(s => s.Features)
                .WithOne(f => f.Service)
                .HasForeignKey(f => f.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Service - ServiceBenefit (1:N)
            modelBuilder.Entity<Service>()
                .HasMany(s => s.Benefits)
                .WithOne(b => b.Service)
                .HasForeignKey(b => b.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Service - CaseStudy (1:N)
            modelBuilder.Entity<Service>()
                .HasMany(s => s.CaseStudies)
                .WithOne(cs => cs.Service)
                .HasForeignKey(cs => cs.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // CaseStudy - CaseStudyResult (1:N)
            modelBuilder.Entity<CaseStudy>()
                .HasMany(cs => cs.Results)
                .WithOne(r => r.CaseStudy)
                .HasForeignKey(r => r.CaseStudyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Project - ProjectTechnology (1:N)
            modelBuilder.Entity<Project>()
                .HasMany(p => p.Technologies)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Project - ProjectResult (1:N)
            modelBuilder.Entity<Project>()
                .HasMany(p => p.Results)
                .WithOne(r => r.Project)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Índices
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Service>()
                .HasIndex(s => s.Name)
                .IsUnique();

            // Datos iniciales (opcional)
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Datos de ejemplo para servicios
            modelBuilder.Entity<Service>().HasData(
                new Service
                {
                    Id = 1,
                    Name = "AI Strategy",
                    Description = "Define tu hoja de ruta de IA alineada con los objetivos de negocio",
                    DetailedDescription = "Definimos la hoja de ruta para implementar IA en tu negocio, alineando las soluciones tecnológicas con tus objetivos empresariales.",
                    Category = "Strategy",
                    Icon = "Brain",
                    Price = 5000M,
                    IsFeatured = true,
                    DisplayOrder = 1,
                    CreatedAt = System.DateTime.UtcNow
                },
                new Service
                {
                    Id = 2,
                    Name = "AI Development",
                    Description = "Soluciones de IA personalizadas desde el concepto hasta la implementación",
                    DetailedDescription = "Desarrollamos soluciones de IA personalizadas que resuelven problemas específicos de tu negocio, desde la idea hasta la implementación.",
                    Category = "Development",
                    Icon = "Bot",
                    Price = 8000M,
                    IsFeatured = true,
                    DisplayOrder = 2,
                    CreatedAt = System.DateTime.UtcNow
                },
                new Service
                {
                    Id = 3,
                    Name = "AI Automation",
                    Description = "Optimiza procesos y aumenta la eficiencia operativa",
                    DetailedDescription = "Automatizamos procesos clave para mejorar la eficiencia, reducir costos y permitir que tu equipo se enfoque en lo que realmente importa.",
                    Category = "Automation",
                    Icon = "Zap",
                    Price = 6000M,
                    IsFeatured = true,
                    DisplayOrder = 3,
                    CreatedAt = System.DateTime.UtcNow
                }
            );

            // Datos de ejemplo para características de servicios
            modelBuilder.Entity<ServiceFeature>().HasData(
                new ServiceFeature
                {
                    Id = 1,
                    Title = "Consultoría Estratégica",
                    Description = "Evaluamos tus necesidades y proponemos estrategias efectivas de IA que se alinean con tus objetivos de negocio.",
                    ServiceId = 1
                },
                new ServiceFeature
                {
                    Id = 2,
                    Title = "Análisis de Datos",
                    Description = "Convertimos tus datos en información valiosa para una toma de decisiones informada y estratégica.",
                    ServiceId = 1
                },
                new ServiceFeature
                {
                    Id = 3,
                    Title = "Desarrollo de Chatbots",
                    Description = "Creamos asistentes virtuales inteligentes que mejoran la atención al cliente y la eficiencia operativa.",
                    ServiceId = 2
                },
                new ServiceFeature
                {
                    Id = 4,
                    Title = "Sistemas de Recomendación",
                    Description = "Implementamos algoritmos que analizan comportamientos y preferencias para ofrecer recomendaciones personalizadas.",
                    ServiceId = 2
                },
                new ServiceFeature
                {
                    Id = 5,
                    Title = "Automatización de Procesos",
                    Description = "Implementamos soluciones que automatizan flujos de trabajo completos, desde la entrada de datos hasta la generación de informes.",
                    ServiceId = 3
                }
            );
        }
    }
}

