# Manual Técnico Altaira Labs - Parte 2: Guías Prácticas

## Índice

1. [Guías para el Frontend](#guías-para-el-frontend)
   - [Modificar el Tema y Colores](#modificar-el-tema-y-colores)
   - [Añadir Nuevas Páginas](#añadir-nuevas-páginas)
   - [Personalizar Componentes](#personalizar-componentes)
   - [Optimizar Rendimiento](#optimizar-rendimiento)

2. [Guías para el Backend](#guías-para-el-backend)
   - [Añadir Nuevos Endpoints](#añadir-nuevos-endpoints)
   - [Implementar Validaciones](#implementar-validaciones)
   - [Gestionar Excepciones](#gestionar-excepciones)
   - [Configurar Seguridad](#configurar-seguridad)

3. [Gestión de la Base de Datos](#gestión-de-la-base-de-datos)
   - [Migraciones y Actualizaciones](#migraciones-y-actualizaciones)
   - [Consultas Avanzadas](#consultas-avanzadas)
   - [Optimización de Rendimiento](#optimización-de-rendimiento-de-la-base-de-datos)

4. [Integración y Despliegue Continuo](#integración-y-despliegue-continuo)
   - [Configurar GitHub Actions](#configurar-github-actions)
   - [Despliegue Automático en Vercel](#despliegue-automático-en-vercel)
   - [Despliegue Automático en Azure](#despliegue-automático-en-azure)

5. [Solución de Problemas Comunes](#solución-de-problemas-comunes)
   - [Problemas de Frontend](#problemas-de-frontend)
   - [Problemas de Backend](#problemas-de-backend)
   - [Problemas de Base de Datos](#problemas-de-base-de-datos)

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

