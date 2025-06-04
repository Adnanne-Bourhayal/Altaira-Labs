### Manual Técnico Completo - Altaira Labs

## Índice

1. [Guías para el Frontend](#guías-para-el-frontend)

1. [Modificar el Tema y Colores](#modificar-el-tema-y-colores)
2. [Añadir Nuevas Páginas](#añadir-nuevas-páginas)
3. [Personalizar Componentes](#personalizar-componentes)
4. [Optimizar Rendimiento](#optimizar-rendimiento)



2. [Guías para el Backend](#guías-para-el-backend)

1. [Añadir Nuevos Endpoints](#añadir-nuevos-endpoints)
2. [Implementar Validaciones](#implementar-validaciones)
3. [Gestionar Excepciones](#gestionar-excepciones)
4. [Configurar Seguridad](#configurar-seguridad)



3. [Gestión de la Base de Datos](#gestión-de-la-base-de-datos)

1. [Migraciones y Actualizaciones](#migraciones-y-actualizaciones)
2. [Consultas Avanzadas](#consultas-avanzadas)
3. [Optimización de Rendimiento](#optimización-de-rendimiento-de-la-base-de-datos)



4. [Integración y Despliegue Continuo](#integración-y-despliegue-continuo)

1. [Configurar GitHub Actions](#configurar-github-actions)
2. [Despliegue Automático en Vercel](#despliegue-automático-en-vercel)
3. [Despliegue Automático en Azure](#despliegue-automático-en-azure)



5. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

1. [Problemas de Frontend](#problemas-de-frontend)
2. [Problemas de Backend](#problemas-de-backend)
3. [Problemas de Base de Datos](#problemas-de-base-de-datos)





## Guías para el Frontend

### Modificar el Tema y Colores

El sistema de temas de Altaira Labs está basado en Tailwind CSS y utiliza variables CSS para definir los colores en modo claro y oscuro.

#### Cambiar Colores Principales

1. Abrir el archivo `app/globals.css`
2. Localizar la sección `:root` para el tema claro y `.dark` para el tema oscuro
3. Modificar las variables CSS según sea necesario


```css
/* Ejemplo: Cambiar el color primario a un tono verde */
:root {
  /* Valores originales */
  /* --primary: 221.2 83.2% 53.3%; (azul) */
  
  /* Nuevos valores (verde) */
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  
  /* Para cambiar el color de acento (naranja a púrpura) */
  /* --accent: 24.6 95% 53.1%; (naranja) */
  --accent: 262.1 83.3% 57.8%; /* púrpura */
  --accent-foreground: 210 40% 98%;
}

.dark {
  /* Valores originales */
  /* --primary: 217.2 91.2% 59.8%; (azul claro) */
  
  /* Nuevos valores (verde claro para modo oscuro) */
  --primary: 142.1 70.6% 45.3%;
  --primary-foreground: 144.9 80.4% 10%;
  
  /* Cambiar acento en modo oscuro */
  /* --accent: 20.5 90.2% 48.2%; (naranja oscuro) */
  --accent: 263.4 70% 50.4%; /* púrpura para modo oscuro */
  --accent-foreground: 210 40% 98%;
}
```

#### Personalizar Gradientes

Los gradientes se utilizan en varios componentes como botones y fondos. Para personalizarlos:

1. Abrir el archivo `app/globals.css`
2. Añadir nuevas clases de gradiente o modificar las existentes


```css
/* Añadir un nuevo gradiente personalizado */
.bg-gradient-custom {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
}

/* Modificar el gradiente existente del héroe */
.bg-gradient-to-r {
  --tw-gradient-from: #10b981; /* verde */
  --tw-gradient-to: #3b82f6; /* azul */
}
```

3. Utilizar las nuevas clases en los componentes


```javascriptreact
<div className="bg-gradient-custom p-6 rounded-lg">
  Contenido con gradiente personalizado
</div>
```

#### Cambiar Modo de Tema por Defecto

1. Abrir el archivo `components/theme-provider.tsx`
2. Localizar la propiedad `defaultTheme` y cambiarla según sea necesario


```javascriptreact
// Cambiar de "light" a "dark" para que el tema oscuro sea el predeterminado
<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
  {children}
</NextThemesProvider>
```

### Añadir Nuevas Páginas

Next.js utiliza un sistema de enrutamiento basado en archivos. Para añadir una nueva página:

#### Crear una Página Básica

1. Crear un nuevo directorio en la carpeta `app/` con el nombre de la ruta deseada
2. Añadir un archivo `page.tsx` dentro del directorio


```typescriptreact
// Ejemplo: app/about/page.tsx
"use client"

import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

export default function AboutPage() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sobre Nosotros
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Conozca más sobre el equipo detrás de Altaira Labs
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section ref={sectionRef} className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div 
            className={cn(
              "transform transition-all duration-700 ease-out",
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
            )}
          >
            <h2 className="text-3xl font-bold mb-6">Nuestra Historia</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Altaira Labs nació con la visión de democratizar el acceso a tecnologías 
              de inteligencia artificial para empresas de todos los tamaños...
            </p>
            {/* Más contenido aquí */}
          </div>
        </div>
      </section>
    </div>
  )
}
```

#### Añadir la Página al Menú de Navegación

1. Abrir el archivo `components/site-header.tsx`
2. Localizar la sección de navegación y añadir un nuevo enlace


```javascriptreact
{/* Navegación de escritorio */}
<nav className="hidden md:flex items-center gap-8">
  <NavLink href="/" label="Home" isScrolled={isScrolled} theme={theme} />
  <NavLink href="/our-solutions" label="Our Solutions" isScrolled={isScrolled} theme={theme} />
  <NavLink href="/about" label="Sobre Nosotros" isScrolled={isScrolled} theme={theme} /> {/* Nuevo enlace */}
  <NavLink href="#contact" label="Contact" isScrolled={isScrolled} theme={theme} />
</nav>

{/* También añadir en el menú móvil */}
<nav className="flex flex-col p-6 space-y-6">
  <MobileNavLink href="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />
  <MobileNavLink href="/our-solutions" label="Our Solutions" onClick={() => setIsMobileMenuOpen(false)} />
  <MobileNavLink href="/about" label="Sobre Nosotros" onClick={() => setIsMobileMenuOpen(false)} /> {/* Nuevo enlace */}
  <MobileNavLink href="#contact" label="Contact" onClick={() => setIsMobileMenuOpen(false)} />
</nav>
```

#### Crear una Página con Parámetros Dinámicos

Para crear páginas con rutas dinámicas:

1. Crear un directorio con el formato `[parametro]` en la carpeta `app/`
2. Añadir un archivo `page.tsx` dentro del directorio


```typescriptreact
// Ejemplo: app/services/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServiceDetailPage() {
  const params = useParams()
  const { id } = params
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aquí normalmente harías una llamada a la API
    // Simulamos la carga de datos
    setTimeout(() => {
      setService({
        id,
        title: `Servicio ${id}`,
        description: "Descripción detallada del servicio...",
        // más datos
      })
      setLoading(false)
    }, 1000)
  }, [id])

  if (loading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Servicios
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {service.description}
        </p>
        {/* Más contenido aquí */}
      </div>
    </div>
  )
}
```

### Personalizar Componentes

#### Modificar Componentes Existentes

Para modificar un componente existente:

1. Localizar el componente en la carpeta `components/`
2. Realizar los cambios necesarios
3. Guardar y verificar los cambios


Ejemplo: Modificar el componente `FloatingChatbot.tsx`

```typescriptreact
// Modificar el mensaje inicial del chatbot
const [messages, setMessages] = useState<Message[]>([
  { 
    id: 1, 
    text: "¡Hola! Soy el asistente virtual de Altaira Labs. ¿En qué puedo ayudarte hoy con soluciones de IA?", 
    isBot: true 
  },
]);

// Cambiar el estilo del encabezado del chatbot
<div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-t-lg flex justify-between items-center">
  {/* Contenido del encabezado */}
</div>
```

#### Crear Nuevos Componentes Reutilizables

Para crear un nuevo componente:

1. Crear un nuevo archivo en la carpeta `components/`
2. Implementar el componente
3. Importar y utilizar el componente donde sea necesario


Ejemplo: Crear un componente `FeatureCard.tsx`

```typescriptreact
// components/feature-card.tsx
import { cn } from "@/lib/utils"
import { TypeIcon as type, LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  className?: string
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-blue-500",
  className,
}: FeatureCardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      <div className="mb-4 bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center">
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}
```

Uso del componente:

```typescriptreact
// En cualquier página o componente
import FeatureCard from "@/components/feature-card"
import { Lightbulb, Zap, BarChart } from 'lucide-react'

// Dentro del render
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <FeatureCard
    title="Soluciones Inteligentes"
    description="Implementamos tecnologías avanzadas que se adaptan a tus necesidades específicas."
    icon={Lightbulb}
    iconColor="text-yellow-500"
  />
  <FeatureCard
    title="Rendimiento Optimizado"
    description="Creamos soluciones eficientes que maximizan la velocidad y reducen costos."
    icon={Zap}
    iconColor="text-blue-500"
  />
  <FeatureCard
    title="Analytics Avanzados"
    description="Obtén insights valiosos con nuestros análisis de datos detallados."
    icon={BarChart}
    iconColor="text-green-500"
  />
</div>
```

#### Extender Componentes de UI

Para extender componentes de la biblioteca shadcn/ui:

1. Crear un nuevo componente que utilice los componentes base
2. Añadir funcionalidades o estilos adicionales


Ejemplo: Crear un componente `EnhancedCard.tsx` basado en el componente `Card`

```typescriptreact
// components/enhanced-card.tsx
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EnhancedCardProps {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  hoverEffect?: boolean
}

export default function EnhancedCard({
  title,
  children,
  footer,
  className,
  hoverEffect = true,
}: EnhancedCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Card 
      className={cn(
        "border border-slate-200 dark:border-slate-700 transition-all duration-300",
        hoverEffect && "hover:shadow-lg",
        isHovered && hoverEffect && "transform scale-[1.02]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
```

### Optimizar Rendimiento

#### Optimización de Imágenes

Para optimizar imágenes:

1. Utilizar el componente `Image` de Next.js


```typescriptreact
import Image from "next/image"

// En lugar de
<img src="/image.jpg" alt="Descripción" />

// Usar
<Image 
  src="/image.jpg" 
  alt="Descripción" 
  width={800} 
  height={600} 
  priority={isImportant} 
  loading="lazy" 
/>
```

2. Implementar carga progresiva para imágenes grandes


```typescriptreact
import { useState } from "react"
import Image from "next/image"

export default function ProgressiveImage({ src, alt, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <div className="relative">
      {/* Imagen de baja resolución como placeholder */}
      <Image
        src={`${src}?quality=10&w=50`}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
      
      {/* Imagen de alta resolución */}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        className={cn(
          "absolute top-0 left-0 transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoadingComplete={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  )
}
```

#### Reducir el Bundle Size

Para reducir el tamaño del bundle:

1. Importar componentes de manera dinámica


```typescriptreact
import dynamic from "next/dynamic"

// En lugar de importar directamente
// import HeavyComponent from "@/components/heavy-component"

// Usar importación dinámica
const HeavyComponent = dynamic(() => import("@/components/heavy-component"), {
  loading: () => <p>Cargando...</p>,
  ssr: false // Si no es necesario renderizar en el servidor
})
```

2. Analizar el bundle con herramientas como `@next/bundle-analyzer`


```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Configuración de Next.js
})
```

Luego ejecutar:

```shellscript
ANALYZE=true npm run build
```

#### Mejorar la Experiencia de Usuario

1. Implementar estados de carga para operaciones asíncronas


```typescriptreact
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    await submitData(formData)
    // Éxito
  } catch (error) {
    // Error
  } finally {
    setIsLoading(false)
  }
}

// En el botón
<button 
  type="submit" 
  disabled={isLoading}
  className={isLoading ? "opacity-70" : ""}
>
  {isLoading ? "Enviando..." : "Enviar"}
</button>
```

2. Implementar virtualizacion para listas largas


```typescriptreact
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedList({ items }) {
  const parentRef = useRef(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // altura estimada de cada elemento
  })
  
  return (
    <div 
      ref={parentRef} 
      className="h-[500px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Guías para el Backend

### Añadir Nuevos Endpoints

#### Backend C# (.NET)

Para añadir un nuevo endpoint:

1. Crear un nuevo controlador o añadir métodos a un controlador existente


```csharp
// Ejemplo: Crear un controlador para proyectos
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AltairaLabsAPI.Models;
using AltairaLabsAPI.Repositories;

namespace AltairaLabsAPI.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class ProjectsController : ControllerBase
  {
    private readonly IProjectRepository _projectRepository;

    public ProjectsController(IProjectRepository projectRepository)
    {
      _projectRepository = projectRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
    {
      var projects = await _projectRepository.GetAllProjectsAsync();
      return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
      var project = await _projectRepository.GetProjectByIdAsync(id);
      
      if (project == null)
        return NotFound(new { message = "Proyecto no encontrado" });
        
      return Ok(project);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] Project project)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);
        
      var createdProject = await _projectRepository.CreateProjectAsync(project);
      return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
    }

    // Más métodos según sea necesario
  }
}
```

2. Registrar dependencias en `Program.cs`


```csharp
// Añadir repositorio al contenedor de dependencias
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
```

#### Backend Java (Spring Boot)

Para añadir un nuevo endpoint:

1. Crear un nuevo controlador


```java
package com.altairalabs.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.altairalabs.api.model.Project;
import com.altairalabs.api.service.ProjectService;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        Project project = projectService.getProjectById(id);
        if (project == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse(false, "Proyecto no encontrado"));
        }
        return ResponseEntity.ok(project);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProject(@Valid @RequestBody Project project) {
        Project createdProject = projectService.createProject(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProject);
    }
    
    // Más métodos según sea necesario
}
```

2. Crear el servicio correspondiente


```java
package com.altairalabs.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altairalabs.api.model.Project;
import com.altairalabs.api.repository.ProjectRepository;

import java.util.List;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    
    public Project getProjectById(Long id) {
        return projectRepository.findById(id).orElse(null);
    }
    
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }
    
    // Más métodos según sea necesario
}
```

### Implementar Validaciones

#### Backend C# (.NET)

Para implementar validaciones:

1. Utilizar Data Annotations en los modelos


```csharp
using System.ComponentModel.DataAnnotations;

public class ProjectCreateDto
{
    [Required(ErrorMessage = "El título es obligatorio")]
    [StringLength(100, ErrorMessage = "El título debe tener entre {2} y {1} caracteres", MinimumLength = 5)]
    public string Title { get; set; }
    
    [Required(ErrorMessage = "La descripción es obligatoria")]
    [StringLength(500, ErrorMessage = "La descripción no puede exceder {1} caracteres")]
    public string Description { get; set; }
    
    [Required(ErrorMessage = "La categoría es obligatoria")]
    public string Category { get; set; }
    
    [DataType(DataType.Date)]
    [Required(ErrorMessage = "La fecha de inicio es obligatoria")]
    public DateTime StartDate { get; set; }
    
    [DataType(DataType.Date)]
    public DateTime? EndDate { get; set; }
}
```

2. Implementar validación personalizada con FluentValidation


```csharp
using FluentValidation;

public class ProjectCreateDtoValidator : AbstractValidator<ProjectCreateDto>
{
    public ProjectCreateDtoValidator()
    {
        RuleFor(p => p.Title)
            .NotEmpty().WithMessage("El título es obligatorio")
            .Length(5, 100).WithMessage("El título debe tener entre 5 y 100 caracteres");
            
        RuleFor(p => p.Description)
            .NotEmpty().WithMessage("La descripción es obligatoria")
            .MaximumLength(500).WithMessage("La descripción no puede exceder 500 caracteres");
            
        RuleFor(p => p.EndDate)
            .GreaterThan(p => p.StartDate)
            .When(p => p.EndDate.HasValue)
            .WithMessage("La fecha de finalización debe ser posterior a la fecha de inicio");
    }
}
```

3. Registrar validadores en `Program.cs`


```csharp
// Registrar FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddScoped<IValidator<ProjectCreateDto>, ProjectCreateDtoValidator>();
```

#### Backend Java (Spring Boot)

Para implementar validaciones:

1. Utilizar anotaciones de validación en los modelos


```java
package com.altairalabs.api.dto;

import java.time.LocalDate;

import javax.validation.constraints.*;

import com.fasterxml.jackson.annotation.JsonFormat;

public class ProjectCreateDto {
    
    @NotBlank(message = "El título es obligatorio")
    @Size(min = 5, max = 100, message = "El título debe tener entre 5 y 100 caracteres")
    private String title;
    
    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String description;
    
    @NotBlank(message = "La categoría es obligatoria")
    private String category;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    // Getters y setters
}
```

2. Implementar validación personalizada


```java
package com.altairalabs.api.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

import com.altairalabs.api.dto.ProjectCreateDto;

public class EndDateAfterStartDateValidator implements ConstraintValidator<EndDateAfterStartDate, ProjectCreateDto> {
    
    @Override
    public boolean isValid(ProjectCreateDto project, ConstraintValidatorContext context) {
        if (project.getEndDate() == null) {
            return true; // Válido si la fecha de fin no está definida
        }
        
        return project.getEndDate().isAfter(project.getStartDate());
    }
}

// Anotación personalizada
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EndDateAfterStartDateValidator.class)
public @interface EndDateAfterStartDate {
    String message() default "La fecha de finalización debe ser posterior a la fecha de inicio";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

3. Aplicar la validación personalizada al DTO


```java
@EndDateAfterStartDate
public class ProjectCreateDto {
    // campos y métodos
}
```

### Gestionar Excepciones

#### Backend C# (.NET)

Para gestionar excepciones:

1. Crear un middleware de manejo de excepciones


```csharp
// Middleware/ExceptionMiddleware.cs
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AltairaLabsAPI.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error no manejado: {ex.Message}");
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "Se ha producido un error interno en el servidor.";
            
            // Personalizar según el tipo de excepción
            if (exception is KeyNotFoundException)
            {
                statusCode = HttpStatusCode.NotFound;
                message = "El recurso solicitado no fue encontrado.";
            }
            else if (exception is UnauthorizedAccessException)
            {
                statusCode = HttpStatusCode.Unauthorized;
                message = "No autorizado para acceder a este recurso.";
            }
            else if (exception is ArgumentException)
            {
                statusCode = HttpStatusCode.BadRequest;
                message = exception.Message;
            }
            
            context.Response.StatusCode = (int)statusCode;
            
            var response = new
            {
                statusCode = context.Response.StatusCode,
                message = message,
                detail = exception.Message
            };
            
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
```

2. Registrar el middleware en `Program.cs`


```csharp
// Añadir middleware de excepciones
app.UseMiddleware<ExceptionMiddleware>();
```

#### Backend Java (Spring Boot)

Para gestionar excepciones:

1. Crear un manejador global de excepciones


```java
package com.altairalabs.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        ApiErrorResponse errorResponse = new ApiErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Se ha producido un error interno en el servidor",
            ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(NoSuchElementException ex) {
        ApiErrorResponse errorResponse = new ApiErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "El recurso solicitado no fue encontrado",
            ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ApiErrorResponse errorResponse = new ApiErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Error de validación",
            errors.toString()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    // Más manejadores según sea necesario
}

// Clase de respuesta de error
class ApiErrorResponse {
    private int status;
    private String message;
    private String detail;
    
    // Constructor, getters, setters
    public ApiErrorResponse(int status, String message, String detail) {
        this.status = status;
        this.message = message;
        this.detail = detail;
    }
    
    // Getters y setters
}
```

### Configurar Seguridad

#### Backend C# (.NET)

Para configurar seguridad:

1. Configurar políticas de CORS


```csharp
// En Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder
            .WithOrigins(builder.Configuration["AllowedOrigins"].Split(','))
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Usar CORS en el pipeline
app.UseCors("AllowSpecificOrigin");
```

2. Configurar Rate Limiting


```csharp
// Instalar Microsoft.AspNetCore.RateLimiting
// En Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429; // Too Many Requests
        context.HttpContext.Response.ContentType = "application/json";
        
        var response = new
        {
            statusCode = 429,
            message = "Demasiadas solicitudes. Por favor, inténtelo más tarde."
        };
        
        await context.HttpContext.Response.WriteAsJsonAsync(response, token);
    };
});

// Usar Rate Limiting en el pipeline
app.UseRateLimiter();
```

#### Backend Java (Spring Boot)

Para configurar seguridad:

1. Configurar CORS


```java
// WebSecurityConfig.java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            // otras configuraciones
            
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

2. Implementar Rate Limiting


```java
// RateLimitingConfig.java
@Configuration
public class RateLimitingConfig {
    
    @Bean
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilter() {
        FilterRegistrationBean<RateLimitingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new RateLimitingFilter());
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }
}

// RateLimitingFilter.java
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private final Map<String, SimpleRateLimiter> limiters = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String clientIp = getClientIP(request);
        SimpleRateLimiter rateLimiter = limiters.computeIfAbsent(clientIp, 
            k -> new SimpleRateLimiter(100, 60)); // 100 requests per minute
        
        boolean allowRequest = rateLimiter.tryAcquire();
        
        if (!allowRequest) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":429,\"message\":\"Demasiadas solicitudes. Por favor, inténtelo más tarde.\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

// SimpleRateLimiter.java
public class SimpleRateLimiter {
    private final long maxRequests;
    private final long timeWindowSeconds;
    private final Queue<Long> requestTimestamps = new ConcurrentLinkedQueue<>();
    
    public SimpleRateLimiter(long maxRequests, long timeWindowSeconds) {
        this.maxRequests = maxRequests;
        this.timeWindowSeconds = timeWindowSeconds;
    }
    
    public boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long windowStart = now - (timeWindowSeconds * 1000);
        
        // Remove timestamps outside the current window
        while (!requestTimestamps.isEmpty() && requestTimestamps.peek() < windowStart) {
            requestTimestamps.poll();
        }
        
        // Check if we're at the limit
        if (requestTimestamps.size() < maxRequests) {
            requestTimestamps.add(now);
            return true;
        }
        
        return false;
    }
}
```

## Gestión de la Base de Datos

### Migraciones y Actualizaciones

#### Entity Framework Core (.NET)

Para gestionar migraciones:

1. Crear una migración inicial


```shellscript
# Instalar la herramienta de línea de comandos de EF Core si aún no está instalada
dotnet tool install --global dotnet-ef

# Crear una migración
dotnet ef migrations add InitialCreate --project AltairaLabsAPI

# Aplicar la migración a la base de datos
dotnet ef database update --project AltairaLabsAPI
```

2. Añadir una nueva entidad y crear una migración para ella


```csharp
// Añadir una nueva entidad al ApplicationDbContext
public DbSet<Newsletter> Newsletters { get; set; }

// Crear la clase de la entidad
public class Newsletter
{
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; }
    
    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
}

// Configurar relaciones en OnModelCreating si es necesario
modelBuilder.Entity<Newsletter>()
    .HasIndex(n => n.Email)
    .IsUnique();
```

3. Crear y aplicar la migración para la nueva entidad


```shellscript
dotnet ef migrations add AddNewsletterEntity --project AltairaLabsAPI
dotnet ef database update --project AltairaLabsAPI
```

#### Hibernate (Java)

Para gestionar migraciones:

1. Configuración de Hibernate con Spring Boot


```plaintext
# application.properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

2. Añadir una nueva entidad


```java
package com.altairalabs.api.model;

import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Entity
@Table(name = "newsletters", uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
public class Newsletter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Email
    @Size(max = 100)
    private String email;
    
    private LocalDateTime subscribedAt = LocalDateTime.now();
    
    private boolean isActive = true;
    
    // Constructores, getters y setters
}
```

3. Crear una migración con Flyway (opcional)


```sql
-- V1__Initial_Schema.sql
CREATE TABLE newsletters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    subscribed_at DATETIME NOT NULL,
    is_active BIT NOT NULL,
    CONSTRAINT uk_newsletters_email UNIQUE (email)
);
```

### Consultas Avanzadas

#### LINQ (Entity Framework)

Para realizar consultas avanzadas:

1. Consultas con filtros y relaciones


```csharp
// Consulta de servicios con características y beneficios, filtrados y ordenados
public async Task<IEnumerable<Service>> GetServicesByCategoryWithDetailsAsync(string category, bool includeFeatured)
{
    var query = _context.Services
        .Include(s => s.Features)
        .Include(s => s.Benefits)
        .AsQueryable();
    
    if (!string.IsNullOrEmpty(category))
    {
        query = query.Where(s => s.Category == category);
    }
    
    if (includeFeatured)
    {
        query = query.Where(s => s.IsFeatured);
    }
    
    return await query
        .OrderBy(s => s.DisplayOrder)
        .ThenBy(s => s.Name)
        .AsNoTracking()
        .ToListAsync();
}
```

2. Consultas con agrupación y proyección


```csharp
// Consultas con agrupación y proyección
public async Task<IEnumerable<ServiceCategorySummary>> GetServiceCategorySummariesAsync()
{
    return await _context.Services
        .GroupBy(s => s.Category)
        .Select(g => new ServiceCategorySummary
        {
            Category = g.Key,
            Count = g.Count(),
            AveragePrice = g.Average(s => s.Price),
            Featured = g.Count(s => s.IsFeatured)
        })
        .OrderByDescending(s => s.Count)
        .ToListAsync();
}

public class ServiceCategorySummary
{
    public string Category { get; set; }
    public int Count { get; set; }
    public decimal AveragePrice { get; set; }
    public int Featured { get; set; }
}
```

3. Consultas con paginación


```csharp
public async Task<(IEnumerable<T> Items, int TotalCount, int PageCount)> GetPagedAsync<T>(
    IQueryable<T> query, int page, int pageSize)
{
    // Validar parámetros
    page = page < 1 ? 1 : page;
    pageSize = pageSize < 1 ? 10 : pageSize;
    
    // Obtener el total sin paginación
    var totalCount = await query.CountAsync();
    
    // Calcular el número total de páginas
    var pageCount = (int)Math.Ceiling(totalCount / (double)pageSize);
    
    // Obtener los elementos de la página actual
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
    
    return (items, totalCount, pageCount);
}

// Uso
public async Task<(IEnumerable<Testimonial>, int, int)> GetPagedTestimonialsAsync(int page, int pageSize, bool onlyApproved)
{
    var query = _context.Testimonials.AsQueryable();
    
    if (onlyApproved)
    {
        query = query.Where(t => t.IsApproved);
    }
    
    query = query.OrderByDescending(t => t.CreatedAt);
    
    return await GetPagedAsync(query, page, pageSize);
}
```

#### JPA (Hibernate)

Para realizar consultas avanzadas:

1. Consultas con JPQL


```java
// En el repositorio
public interface ServiceRepository extends JpaRepository<Service, Long> {
    
    @Query("SELECT s FROM Service s JOIN FETCH s.features JOIN FETCH s.benefits WHERE s.category = :category")
    List<Service> findByCategoryWithDetails(@Param("category") String category);
    
    @Query("SELECT s FROM Service s WHERE s.isFeatured = true ORDER BY s.displayOrder")
    List<Service> findAllFeatured();
    
    @Query("SELECT NEW com.altairalabs.api.dto.ServiceCategorySummary(s.category, COUNT(s), AVG(s.price), SUM(CASE WHEN s.isFeatured = true THEN 1 ELSE 0 END)) " +
           "FROM Service s GROUP BY s.category ORDER BY COUNT(s) DESC")
    List<ServiceCategorySummary> findServiceCategorySummaries();
}

// DTO para la proyección
public class ServiceCategorySummary {
    private String category;
    private Long count;
    private Double averagePrice;
    private Long featured;
    
    // Constructor, getters y setters
}
```

2. Implementar paginación


```java
// En el servicio
public Page<Testimonial> getPagedTestimonials(int page, int size, boolean onlyApproved) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    
    if (onlyApproved) {
        return testimonialRepository.findByIsApprovedTrue(pageable);
    } else {
        return testimonialRepository.findAll(pageable);
    }
}

// En el controlador
@GetMapping("/testimonials")
public ResponseEntity<Page<Testimonial>> getTestimonials(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "true") boolean onlyApproved) {
    
    Page<Testimonial> testimonials = testimonialService.getPagedTestimonials(page, size, onlyApproved);
    return ResponseEntity.ok(testimonials);
}
```

### Optimización de Rendimiento de la Base de Datos

#### Índices

Para optimizar el rendimiento con índices:

1. Añadir índices a campos frecuentemente consultados


```csharp
// Entity Framework (.NET)
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Índice simple
    modelBuilder.Entity<Service>()
        .HasIndex(s => s.Category);
    
    // Índice compuesto
    modelBuilder.Entity<Service>()
        .HasIndex(s => new { s.Category, s.IsFeatured });
    
    // Índice único
    modelBuilder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique();
    
    // Índice para búsqueda de texto
    modelBuilder.Entity<Service>()
        .HasIndex(s => s.Name);
}
```

```java
// JPA/Hibernate (Java)
@Entity
@Table(name = "services", indexes = {
    @Index(name = "idx_service_category", columnList = "category"),
    @Index(name = "idx_service_category_featured", columnList = "category, is_featured"),
    @Index(name = "idx_service_name", columnList = "name")
})
public class Service {
    // Propiedades y métodos
}
```

#### Optimización de Consultas

Para optimizar consultas:

1. Usar proyecciones para seleccionar solo los campos necesarios


```csharp
// Entity Framework (.NET)
public async Task<IEnumerable<ServiceSummary>> GetServiceSummariesAsync()
{
    return await _context.Services
        .Select(s => new ServiceSummary
        {
            Id = s.Id,
            Name = s.Name,
            Description = s.Description,
            Category = s.Category,
            IsFeatured = s.IsFeatured
        })
        .AsNoTracking()
        .ToListAsync();
}
```

```java
// JPA/Hibernate (Java)
@Query("SELECT NEW com.altairalabs.api.dto.ServiceSummary(s.id, s.name, s.description, s.category, s.isFeatured) FROM Service s")
List<ServiceSummary> findAllServiceSummaries();
```

2. Optimizar consultas N+1


```csharp
// Mal: Consulta N+1
var services = await _context.Services.ToListAsync();
foreach (var service in services)
{
    // Esto causa una consulta por cada servicio
    var features = await _context.ServiceFeatures.Where(f => f.ServiceId == service.Id).ToListAsync();
}

// Bien: Usar Include para cargar relaciones
var services = await _context.Services
    .Include(s => s.Features)
    .ToListAsync();
```

```java
// Mal: Consulta N+1
List<Service> services = serviceRepository.findAll();
for (Service service : services) {
    // Esto causa una consulta por cada servicio si la relación es lazy
    List<ServiceFeature> features = service.getFeatures();
}

// Bien: Usar JOIN FETCH
@Query("SELECT s FROM Service s LEFT JOIN FETCH s.features")
List<Service> findAllWithFeatures();
```

#### Caché

Para implementar caché:

1. Configurar caché para consultas frecuentes


```csharp
// Entity Framework (.NET) con MemoryCache
public async Task<IEnumerable<Service>> GetFeaturedServicesAsync()
{
    string cacheKey = "FeaturedServices";
    
    if (!_memoryCache.TryGetValue(cacheKey, out IEnumerable<Service> services))
    {
        services = await _context.Services
            .Include(s => s.Features)
            .Where(s => s.IsFeatured)
            .OrderBy(s => s.DisplayOrder)
            .AsNoTracking()
            .ToListAsync();
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
            .SetSlidingExpiration(TimeSpan.FromMinutes(2));
        
        _memoryCache.Set(cacheKey, services, cacheOptions);
    }
    
    return services;
}
```

```java
// Spring Cache (Java)
@Service
public class ServiceService {
    
    @Autowired
    private ServiceRepository serviceRepository;
    
    @Cacheable(value = "featuredServices", key = "'all'")
    public List<Service> getFeaturedServices() {
        return serviceRepository.findAllFeatured();
    }
    
    @CacheEvict(value = "featuredServices", allEntries = true)
    public void refreshFeaturedServicesCache() {
        // Este método limpia la caché
    }
}
```

## Integración y Despliegue Continuo

### Configurar GitHub Actions

Para configurar CI/CD con GitHub Actions:

1. Crear un workflow para el frontend (Next.js)


```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - '**'
      - '!backend/**'
  pull_request:
    branches: [ main ]
    paths:
      - '**'
      - '!backend/**'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
    
    - name: Test
      run: npm test
    
    - name: Deploy to Vercel
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: ./
        vercel-args: '--prod'
```

2. Crear un workflow para el backend (.NET)


```yaml
# .github/workflows/backend-dotnet.yml
name: Backend .NET CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 7.0.x
    
    - name: Restore dependencies
      run: dotnet restore
      working-directory: ./backend/AltairaLabsAPI
    
    - name: Build
      run: dotnet build --no-restore
      working-directory: ./backend/AltairaLabsAPI
    
    - name: Test
      run: dotnet test --no-build --verbosity normal
      working-directory: ./backend/AltairaLabsAPI
    
    - name: Publish
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      run: dotnet publish -c Release -o ./publish
      working-directory: ./backend/AltairaLabsAPI
    
    - name: Deploy to Azure
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'altaira-labs-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./backend/AltairaLabsAPI/publish
```

### Despliegue Automático en Vercel

Para configurar el despliegue automático en Vercel:

1. Configurar el proyecto en la plataforma Vercel

1. Conectar el repositorio de GitHub
2. Configurar variables de entorno
3. Definir los comandos de build



2. Configurar `vercel.json` en la raíz del proyecto


```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url"
  }
}
```

3. Automatizar despliegues con GitHub Actions

1. Utilizar el action `amondnet/vercel-action@v20` como se mostró anteriormente
2. Configurar los secretos en GitHub para VERCEL_TOKEN, VERCEL_ORG_ID y VERCEL_PROJECT_ID





### Despliegue Automático en Azure

Para configurar el despliegue automático en Azure:

1. Configurar el servicio de App Service en Azure

1. Crear un nuevo App Service en el portal de Azure
2. Configurar el plan de servicio adecuado
3. Establecer variables de aplicación para configuración



2. Configurar el despliegue continuo

1. Generar un perfil de publicación desde el portal de Azure
2. Añadir el perfil como secreto en GitHub (AZURE_WEBAPP_PUBLISH_PROFILE)
3. Utilizar el action `azure/webapps-deploy@v2` como se mostró anteriormente



3. Configurar entornos de desarrollo, pruebas y producción

1. Usar slots en Azure App Service para tener diferentes entornos
2. Configurar variables de aplicación específicas para cada entorno
3. Implementar procesos de prueba antes de promocionar a producción





## Solución de Problemas Comunes

### Problemas de Frontend

#### Problemas de Renderizado

1. **Problema**: Componentes que no se renderizan correctamente en el modo oscuro.

**Solución**: Verificar que se estén utilizando las variables CSS de tema definidas en `globals.css`:

```typescriptreact
// Incorrecto
<div className="text-blue-600">Texto en color azul</div>

// Correcto
<div className="text-primary">Texto en color primario que respeta el tema</div>
```


2. **Problema**: Componentes que muestran "hydration mismatch" en consola.

**Solución**: Asegurarse de que el renderizado del servidor coincida con el del cliente:

```typescriptreact
// Problema (usa estados antes de la hidratación)
export default function Component() {
  const [mounted, setMounted] = useState(true);
  return <div>{mounted && <ChildComponent />}</div>;
}

// Solución
export default function Component() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null; // o un esqueleto de carga
  }
  
  return <div><ChildComponent /></div>;
}
```




#### Problemas de Rendimiento

1. **Problema**: Animaciones lentas o con lag, especialmente en dispositivos móviles.

**Solución**: Optimizar animaciones usando propiedades que favorecen GPU:

```css
/* Antes */
.animate-element {
  transition: all 0.3s ease;
}

/* Después - Uso de propiedades específicas y transform para rendimiento */
.animate-element {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}
```


2. **Problema**: Carga lenta de la página inicial.

**Solución**: Implementar carga diferida (lazy loading) para componentes pesados:

```typescriptreact
import dynamic from 'next/dynamic';

// Cargar componente pesado solo cuando sea necesario
const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <div>Cargando...</div>,
  ssr: false // Si no es necesario en el servidor
});
```




### Problemas de Backend

#### Problemas de Autenticación

1. **Problema**: Tokens JWT que expiran demasiado rápido o problemas con refresh tokens.

**Solución**: Ajustar tiempos de expiración y asegurar que el proceso de refresh sea correcto:

```csharp
// Aumentar tiempo de expiración del JWT
var tokenDescriptor = new SecurityTokenDescriptor
{
    // ...
    // Cambiar de 1 hora a 2 horas
    Expires = DateTime.UtcNow.AddHours(2),
    // ...
};

// Asegurar que el refresh token tenga un tiempo apropiado
var refreshToken = new RefreshToken
{
    // ...
    // Cambiar de 7 días a 14 días
    Expires = DateTime.UtcNow.AddDays(14),
    // ...
};
```


2. **Problema**: Cookies de refresh token no persistentes o problemas de CORS.

**Solución**: Configurar correctamente las cookies y CORS:

```csharp
// Configurar cookie del refresh token
var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    Expires = DateTime.UtcNow.AddDays(14),
    SameSite = SameSiteMode.None, // Para solicitudes cross-site
    Secure = true // Solo HTTPS
};

// Configurar CORS para permitir cookies
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder
            .WithOrigins("https://altairalabs.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()); // Importante para cookies
});
```




#### Problemas de Rendimiento del API

1. **Problema**: Endpoint que toma demasiado tiempo en responder.

**Solución**: Implementar caché y optimizar consultas:

```csharp
// Implementar caché en el endpoint lento
[HttpGet("statistics")]
[ResponseCache(Duration = 300)] // Caché por 5 minutos
public async Task<ActionResult<StatisticsDto>> GetStatistics()
{
    // Consulta optimizada
    var result = await _statisticsService.GetCachedStatisticsAsync();
    return Ok(result);
}
```


2. **Problema**: Alta carga en el servidor durante picos de tráfico.

**Solución**: Implementar patrones de resiliencia como Circuit Breaker y rate limiting:

```csharp
// Implementar Circuit Breaker con Polly
services.AddHttpClient("external-api")
    .AddPolicyHandler(GetCircuitBreakerPolicy());

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1));
}

// Implementar Rate Limiting
app.UseRateLimiter(new RateLimiterOptions
{
    GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ipAddress, 
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            });
    })
});
```




### Problemas de Base de Datos

#### Problemas de Rendimiento de Consultas

1. **Problema**: Consultas lentas que afectan el rendimiento de la aplicación.

**Solución**: Analizar y optimizar consultas, añadir índices:

```sql
-- Añadir índices para consultas frecuentes
CREATE INDEX idx_services_category ON Services(Category);
CREATE INDEX idx_services_featured ON Services(IsFeatured) WHERE IsFeatured = 1;

-- Optimizar consulta
-- Antes
SELECT * FROM Services WHERE Category = 'AI Strategy';

-- Después (seleccionando solo columnas necesarias)
SELECT Id, Name, Description, Icon FROM Services WHERE Category = 'AI Strategy';
```


2. **Problema**: Bloqueos de base de datos durante operaciones de escritura.

**Solución**: Optimizar transacciones y considerar niveles de aislamiento:

```csharp
using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);

try
{
    // Operaciones de base de datos...
    
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```




#### Problemas de Migraciones

1. **Problema**: Migraciones que fallan al aplicarse en producción.

**Solución**: Probar migraciones en entorno de staging y usar scripts idempotentes:

```csharp
// En lugar de ejecutar migraciones directamente
// dotnet ef database update

// Usar scripts SQL idempotentes
if not exists (select * from sys.indexes where name = 'IX_Services_Category')
begin
    CREATE INDEX IX_Services_Category ON Services(Category);
end
```


2. **Problema**: Conflictos en migraciones entre entornos de desarrollo y producción.

**Solución**: Mantener una estrategia consistente de migraciones y control de versiones:

```shellscript
# Comprobar estado de migraciones
dotnet ef migrations list

# Generar script SQL para revisión manual
dotnet ef migrations script LastGoodMigration TargetMigration -o Migration.sql

# Aplicar migraciones específicas
dotnet ef database update TargetMigration
```


Este manual técnico completo proporciona una guía detallada para desarrolladores y administradores que trabajan con el proyecto Altaira Labs. Cubre todos los aspectos esenciales del frontend, backend, base de datos, integración continua y solución de problemas comunes, facilitando el mantenimiento y la evolución del sistema.