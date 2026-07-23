# Architecture & Provisioning Engine Cleanup Proposal

> Estado: propuesta de auditoría. No se ha modificado código, reglas, formularios, dependencias, migraciones ni producción.
>
> Fecha de auditoría: 2026-07-20

## 1. Resumen ejecutivo

El proyecto tiene una base funcional real y bastante más avanzada que una maqueta: guarda intakes, genera recomendaciones, convierte leads, crea clientes y workspaces internos, aplica límites de acceso por cliente, prepara onboarding, gestiona tareas y genera planes de aprovisionamiento en modo dry-run.

El `Provisioning Engine`, sin embargo, **todavía no está listo para actuar como núcleo de decisiones de Altaira Labs**. Es seguro porque no ejecuta proveedores, pero su catálogo de decisiones es demasiado pequeño:

- solo existen cuatro rutas: web estática, web custom, CRM Altaira y booking custom;
- Booking siempre se convierte en desarrollo custom;
- CRM siempre se convierte en CRM propio de Altaira;
- Automation y Dashboard caen en la ruta genérica de web custom;
- CMS y ecommerce simple se sobreaprovisionan con Render y Neon;
- una recomendación de varios servicios se reduce a una sola ruta por prioridad;
- sector, presupuesto, mantenimiento, datos sensibles, volumen, preferencia SaaS/código y complejidad real no participan en la decisión;
- todos los planes reportan A3 parcial aunque sus proveedores solo sean descriptores dry-run.

La conclusión práctica es:

1. Mantener el dry-run y la separación plan/ejecución.
2. No conectar aún `Confirm and provision`.
3. Separar qualification de discovery/provisioning.
4. Añadir rutas explícitas para CMS, ecommerce SaaS, booking SaaS, CRM externo, automation y BI/dashboard.
5. Convertir el motor de una cascada de prioridades en una composición de tracks por servicio.
6. Incorporar los cuatro sectores de lanzamiento como contexto real: Clinics, Car Dealers, Restaurants y Specialty by Sector.
7. Cubrir la matriz con tests de dominio antes de implementar proveedores reales.

### Evidencia ejecutada

Se ejecutaron únicamente los tests existentes del motor, sin APIs externas:

```bash
cd backend
./mvnw -Dtest='BackendApplicationTests#generatesIdempotentStaticWebsiteProvisioningDryRun+generatesCustomApplicationProvisioningDryRunWithoutExecutingProviders+generatesSectorAlignedClinicCrmAndRestaurantBookingPlans' test
```

Resultado:

- 3 métodos de test;
- 4 casos de negocio efectivos: web estática, web custom, CRM de clínica y booking de restaurante;
- 3 tests pasados, 0 fallos, 0 errores;
- H2 local, sin Neon, Render, Jira, GitHub ni otras APIs reales.

Los 46 escenarios solicitados se analizan en este documento, pero solo 4 están actualmente demostrados por fixtures automatizados. No se añadieron tests porque esta fase autoriza únicamente una propuesta Markdown.

## 2. Estado general de la arquitectura

### 2.1 Fortalezas que conviene conservar

- Spring Boot separa controllers, services, repositories, DTOs y entidades.
- El frontend usa TypeScript `strict` y proxies server-side para el backend.
- La autorización real se valida en backend; el middleware de Next.js solo mejora navegación.
- `ClientAccessService` filtra el workspace asociado al usuario y rechaza accesos cruzados.
- Las tareas y recursos contienen `client`, `workspace`, `service` y `project`.
- Los providers del nuevo motor implementan `executionSupported() = false`.
- El plan mantiene herramientas seleccionadas, elementos, pasos manuales y placeholders externos.
- Hay una restricción lógica de un plan por assessment, útil como primera barrera idempotente.
- `spring.jpa.hibernate.ddl-auto=none` evita mutaciones automáticas de producción.
- Las notificaciones guardan el lead aunque el correo falle.
- La UI distingue admin, preview de cliente y cliente real.

### 2.2 Estado cuantitativo

- Backend: aproximadamente 17.700 líneas Java.
- Frontend: aproximadamente 31.500 líneas TS/TSX.
- Backend: 29 repositorios JPA detectados durante tests.
- Existen varios servicios de 580-780 líneas.
- Existen componentes/páginas frontend de 850-3.000 líneas.
- No hay Flyway o Liquibase; las migraciones SQL se aplican manualmente.
- Hay una segunda integración GitHub específica, separada de los providers dry-run del motor.

### 2.3 God classes y componentes

| Archivo/clase | Tamaño aproximado | Señal principal |
|---|---:|---|
| `ClientCrmLeadService.java` | 781 líneas | CRUD, permisos, eventos, notas, mapeo admin/cliente, JSON y normalización |
| `ClientPortalService.java` | 748 líneas | portal, proyectos, assets, links, snapshots, acciones y mapeo |
| `LeadNotificationService.java` | 704 líneas | SMTP, Resend, diagnóstico, payload, HTML y clasificación de errores |
| `OnboardingService.java` | 583 líneas | generación, submit, archivos, firma, auditoría, estado y mapeo |
| `AdminOnboardingReview.tsx` | 2.998 líneas | tipos, data fetching, estado, reviewers, UI y plantillas |
| `ClientDashboardShell.tsx` | 2.919 líneas | portal, CRM, assets, links, feedback, guías y UI |
| `app/clients/[id]/operations/page.tsx` | 1.595 líneas | 35 estados y 17 llamadas `fetch` |
| `AdminTasks.tsx` | 1.224 líneas | 28 estados, filtros, tabla, timeline, CRUD y modales |

No son un problema solo por tamaño. El problema es la mezcla de responsabilidades, que aumenta la probabilidad de romper permisos o comportamiento al modificar UI.

## 3. Funcionamiento actual del Provisioning Engine

### 3.1 Flujo real actual

```text
AdminLeadIntake
  -> POST /api/internal/leads/admin-intake
  -> POST /api/v1/leads/admin-intake
  -> LeadAssessmentService
      -> guarda Lead
      -> guarda LeadAssessment
      -> recomienda hasta 2 servicios
  -> POST /api/v1/leads/{leadId}/provisioning-plans/dry-run
  -> ProvisioningRequirementNormalizer
  -> ProvisioningDecisionEngine
  -> ProvisioningPlanService
      -> guarda plan y detalles
      -> crea placeholders externos
      -> executionAllowed=false
```

### 3.2 Veredicto por capacidad

| Capacidad | Estado | Evidencia |
|---|---|---|
| Guardar Lead Intake | Implementado y probado | `LeadController#createAdminIntake`, `LeadAssessmentService#createAdminIntake` |
| Guardar respuestas | Implementado y probado | `LeadAssessmentEntity.responsesJson` |
| Recomendar servicio | Implementado y probado parcialmente | `LeadAssessmentService#recommend` |
| Normalizar requisitos | Implementado y probado parcialmente | `ProvisioningRequirementNormalizer` |
| Elegir ruta | Implementado internamente | `ProvisioningDecisionEngine#decide` |
| Elegir herramientas | Implementado internamente | decisiones hardcoded por ruta |
| Mostrar dry-run | Implementado y probado | `ProvisioningPlanPanel`, `ProvisioningPlanController` |
| Guardar plan | Implementado y probado | `ProvisioningPlanService` y repositorios |
| Evitar un segundo plan para el mismo assessment | Implementado parcialmente | `findByAssessment`; regenera el contenido |
| Ejecutar providers | No implementado por diseño | `ProvisioningProvider#executionSupported=false` |
| Crear Jira/GitHub/Drive/Vercel/Render/Neon | No implementado en este motor | placeholders, no llamadas API |
| Reintentar pasos | No implementado | no existen jobs/intentos |
| Rollback/compensación | No implementado | no existe ejecución |
| Plan compuesto por varios servicios | No implementado | prioridad Booking > CRM > Static > Custom |
| Coste bajo/medio/alto | No implementado | texto genérico por ruta |
| Decisión explicable por regla | Parcial | existe `reason`, no hay trazabilidad por señal |

### 3.3 Requisitos normalizados actuales

`RequirementSet` contiene 17 flags:

```text
database, backend, frontend, static_site, auth, cms, payments,
booking, crm, calendar, automation, file_storage, dashboard,
realtime, data_migration, training, external_integrations
```

Faltan capacidades necesarias para decidir bien:

- `solution_ownership`;
- `saas_preference`;
- `budget_band`;
- `maintenance_owner`;
- `data_sensitivity`;
- `availability_requirement`;
- `multilingual`;
- `multi_location`;
- `multi_user`;
- `approval_workflow`;
- `expected_volume`;
- `export_required`;
- `analytics_required`;
- `existing_provider`;
- `integration_criticality`;
- `retry_required`;
- `mobile_support`;
- `sector_context`.

### 3.4 Problemas de decisión actuales

1. `ProvisioningDecisionEngine#decide` devuelve una única decisión.
2. Booking gana siempre a CRM y el resto.
3. CRM gana siempre a web, automation y dashboard.
4. CMS impide la ruta estática y cae en web custom.
5. Ecommerce siempre activa backend, base de datos y pagos propios.
6. Booking activa siempre frontend, backend, base de datos y auth.
7. CRM activa siempre frontend, backend, base de datos, auth y training.
8. Automation activa backend e integraciones, pero se decide como web custom.
9. Dashboard activa frontend, backend, base de datos y auth, pero se decide como web custom.
10. `external_integrations` no selecciona una alternativa externa concreta.
11. Todos los providers dry-run tienen nivel fijo; el nivel del plan no refleja la ejecución real.
12. La regeneración reemplaza hijos y restablece el plan a `draft`, incluso si estaba aprobado.
13. Las idempotency keys dependen de la posición del elemento, no de una identidad de negocio estable.

## 4. Los cuatro sectores como dimensión obligatoria

La web define correctamente cuatro sectores en `lib/public-site-data.ts`:

| Sector | Problema comercial central | Servicios principales |
|---|---|---|
| Clinics | intake, citas, seguimiento y contexto sensible | Booking, CRM, Dashboard |
| Car Dealers | escaparate, cualificación y seguimiento comercial | Web, CRM, Automation |
| Restaurants | reservas, aforo, eventos y comunicación | Booking, Web, Automation |
| Specialty by Sector | flujo específico que no encaja en software genérico | Dashboard, Automation, CRM |

El backend ya representa `clinics`, `restaurants`, `car_dealers` y `custom` en `SectorType`, onboarding y CRM. Sin embargo, `sector` no llega a `RequirementSet` ni altera riesgos, herramientas o rutas.

### Demos sectoriales de referencia

Todos los nombres siguientes son **demos ficticias**. No representan clientes, acuerdos,
resultados, testimonios ni negocios contactados por Altaira Labs. Su finalidad es
probar el motor y enseñar una propuesta comercial sin atribuir una relación real.

| Demo ficticia | Perfil comercial | Intake esperado | Plan correcto | Resultado actual |
|---|---|---|---|---|
| Iberia Dental Demo | pequeña clínica dental o estética multilingüe | web formal editable, booking para varios profesionales, CRM de leads/pacientes, recordatorios y dashboard básico | plan compuesto Web/CMS + Booking SaaS + CRM Altaira + Automation managed + Dashboard BI; privacidad elevada | Booking custom absorbe el plan y oculta los demás tracks |
| Hispano Motors Demo | pequeño concesionario o compraventa familiar | inventario editable, formularios de interés, pipeline CRM y seguimiento automático | plan compuesto Web/CMS o custom según el inventario + CRM Altaira + Automation managed | CRM gana; web y automation no producen tracks propios |
| Tapas Bistro Demo | restaurante español, tapas bar, cafetería latina u horeca pequeño | web editable, menú, SEO local, reservas, Google Calendar y recordatorios | plan compuesto Web/CMS + Booking SaaS + Calendar + Automation managed | Booking custom gana; CMS, SEO y recordatorios quedan incompletos |
| Asesoría Hispana Demo | gestoría, academia, inmobiliaria o servicio local en español | formularios, CRM, automatización documental, dashboard interno y Drive | plan compuesto CRM Altaira + Automation managed + Dashboard BI + Drive; discovery obligatorio para documentos y permisos | CRM o web custom genérico según el primer flag activo |

Los mercados futuros de referencia son pequeños negocios en Bélgica/Benelux y
España, especialmente cuando atienden en español junto con inglés, francés o
neerlandés. Esto es segmentación comercial, no una inferencia de nacionalidad o
etnia sobre propietarios concretos.

### Contrato esperado de los cuatro fixtures

La futura suite parametrizada debe construir cada fixture con respuestas explícitas,
sin asumir campos ausentes. Las rutas se compararán por track, no como una única ruta
global.

| Fixture | Requisitos normalizados esperados | Rutas y herramientas esperadas | Exclusiones esperadas | Nivel esperado | Pasos manuales y riesgos mínimos |
|---|---|---|---|---|---|
| Iberia Dental Demo | frontend, CMS, booking, CRM, calendar, automation, dashboard, auth; faltan `multilingual` y `sensitive_data` en el modelo actual | `WEB_CMS`, `BOOKING_SAAS`, `CRM_ALTAIRA`, `AUTOMATION_MANAGED`, `DASHBOARD_BI`; CMS, booking SaaS, Altaira CRM, GC, RS y BI | motor booking propio, ST si no hay depósito, nueva infraestructura custom salvo requisito probado | A2 para SaaS/OAuth; A3 interno para CRM; A1/A2 para BI | aprobar contenidos clínicos, OAuth de calendarios, roles y base jurídica; riesgo de datos sensibles, citas duplicadas y acceso cruzado |
| Hispano Motors Demo | frontend, CMS o datos según fuente de inventario, CRM, automation; faltan `inventory_source` y `media_volume` | `WEB_CMS` para inventario manual o `WEB_CUSTOM` para feed propio, `CRM_ALTAIRA`, `AUTOMATION_MANAGED`; CRM, formularios, RS/AUT | pagos, booking, dashboard y backend custom si el CMS cubre inventario | A2 para CMS/automation; A3 interno para CRM | decidir fuente de inventario, derechos de imágenes y mapping del formulario; riesgo de leads duplicados y stock desactualizado |
| Tapas Bistro Demo | frontend, CMS, booking, calendar, automation; faltan `multilingual`, `local_seo` y complejidad de recursos | `WEB_CMS`, `BOOKING_SAAS`, `AUTOMATION_MANAGED`; CMS, booking SaaS, GC y RS | CRM completo, ST sin depósito, motor custom si una agenda estándar cubre el caso | A2 | configurar cuenta, calendario, menú, horarios y política de cancelación; riesgo de overbooking, horarios incorrectos y dependencia del proveedor |
| Asesoría Hispana Demo | CRM, file storage, external integrations, automation, dashboard, auth; faltan `document_sensitivity`, `approval_workflow` y retención | `CRM_ALTAIRA`, `AUTOMATION_MANAGED`, `DASHBOARD_BI`; Altaira CRM, GD y BI | ecommerce, booking y nueva web/app si el diagnóstico no los pide | A2 para Drive/automation/BI; A3 interno para CRM | aprobar permisos, estructura documental y retención; riesgo de documentos confidenciales, enlaces compartidos y automatizaciones sin revisión |

Resultado actual esperado por análisis estático:

- los cuatro fixtures deberían fallar la comparación de ruta compuesta;
- Iberia Dental Demo y Tapas Bistro Demo caerían en `BOOKING_CUSTOM`;
- Hispano Motors Demo y Asesoría Hispana Demo quedarían dominadas por CRM o por
  la primera prioridad activa;
- el motor no puede expresar todavía varias dimensiones requeridas por estos casos.

Esto es una predicción documentada, no un resultado ejecutado. En este bloque no se
crean tests porque se ha ordenado no programar todavía. El siguiente bloque de tests
deberá medir expected vs actual sin modificar la lógica.

Estos cuatro casos deben ser los primeros fixtures integrales antes de añadir datos
de otros sectores.

La captación futura y las condiciones para convertir una demo en un caso real se
definen por separado en
[`docs/sales/PILOT_PROSPECT_STRATEGY.md`](../sales/PILOT_PROSPECT_STRATEGY.md).

## 5. Catálogo de rutas recomendado

Este catálogo es una propuesta para tests y diseño. No implica crear providers ahora.

| Ruta propuesta | Uso |
|---|---|
| `WEB_STATIC` | web informativa sin persistencia, auth, pagos ni CMS |
| `WEB_CMS` | contenido editable, blog o páginas gestionadas |
| `WEB_CUSTOM` | lógica propia, auth, datos o workflow web |
| `ECOMMERCE_PLATFORM` | Shopify/WooCommerce u otra plataforma cuando cubra el alcance |
| `ECOMMERCE_CUSTOM` | comercio con lógica no cubierta por plataforma |
| `BOOKING_SAAS` | agenda configurable cubierta por herramienta existente |
| `BOOKING_CUSTOM` | recursos, aforo, concurrencia o reglas realmente propias |
| `CRM_ALTAIRA` | CRM ligero dentro del workspace Altaira |
| `CRM_EXTERNAL` | configurar/migrar/integrar un CRM existente o externo |
| `AUTOMATION_MANAGED` | Make/n8n/Zapier o workflow gestionado |
| `AUTOMATION_CUSTOM` | job, cola o backend propio por criticidad |
| `DASHBOARD_BI` | Power BI, Metabase, Looker Studio, Superset u otra herramienta BI |
| `DASHBOARD_CUSTOM` | experiencia, permisos o interacción no cubierta por BI |

Un lead con varios servicios no debe forzarse a una ruta global. Debe producir:

```text
ProvisioningPlan
  -> TrackDecision[web]
  -> TrackDecision[booking]
  -> TrackDecision[crm]
  -> SharedResourceDecision[Drive/Jira/etc.]
```

Los recursos compartidos deben deduplicarse por `client + provider + resourceType + purpose`.

## 6. Matriz de 46 escenarios

### 6.1 Leyenda

- Herramientas: `GH` GitHub, `VE` Vercel, `RE` Render, `NE` Neon, `JI` Jira, `GD` Drive, `RS` Resend, `ST` Stripe, `GC` Google Calendar.
- Familias pendientes de decisión: `CMS`, `COM` ecommerce platform, `BKS` booking SaaS, `EXT-CRM`, `AUT` Make/n8n/Zapier/custom, `BI`.
- Nivel propuesto:
  - `A3`: automatizable tras aprobación, con API e idempotencia;
  - `A2`: asistido; necesita OAuth, cuenta o aprobación;
  - `A1`: prepara configuración/artefacto, ejecución manual;
  - `M`: manual.
- El coste es una banda relativa de implantación, no un precio comercial.
- `JI?` y `GD?` indican opcionales. No se deben crear automáticamente para trabajos mínimos sin aprobación.

### 6.2 Web & SEO

| ID | Sector/demo | Escenario y respuestas clave | Capacidades/ruta esperada | In / Out | Nivel; manual; riesgo; coste | Motor actual |
|---|---|---|---|---|---|---|
| W01 | Specialty local | informativa; CMS no; auth no; datos no; pagos no | frontend estático; `WEB_STATIC` | In GH, VE; JI?/GD? / Out RE, NE, ST, AUTH, CMS | A3; dominio/DNS; contenido; bajo | Ruta correcta; sobreincluye JI/GD |
| W02 | Clinic | formal profesional; igual a W01; SEO local | `WEB_STATIC` con revisión legal/trust | In GH, VE; GD? / Out RE, NE, ST | A3/A2; contenido clínico; claims y privacidad; bajo-medio | No distingue formal de básica |
| W03 | Car Dealer | premium visual; sin datos operativos | `WEB_STATIC`; diseño/Figma manual | In GH, VE; Figma M / Out RE, NE, ST | A2; aprobación visual; media pesada; medio | Ruta estática, pero sin tier visual |
| W04 | Restaurant | editable; `contentManagement=yes` | `WEB_CMS` | In CMS; GH/VE según proveedor / Out RE, NE, ST por defecto | A2/M; cuenta CMS; dependencia proveedor; medio | `WEB_CUSTOM`: sobreaprovisiona RE+NE |
| W05 | Specialty | blog/CMS; edición frecuente | `WEB_CMS` | In CMS, analytics / Out RE, NE, ST por defecto | A2; roles/editorial; mantenimiento; medio | `WEB_CUSTOM`: fallo de ruta |
| W06 | Clinic Benelux | multilingüe; CMS según editor | `WEB_STATIC` o `WEB_CMS` condicionado | In traducción/SEO; Out backend si no hay datos | A1/A2; traducciones; contenido inconsistente; medio | No existe pregunta ni requisito multilingüe |
| W07 | Car Dealer | formulario a email/CRM; sin persistencia propia | `WEB_STATIC` + form/RS o CRM | In GH, VE, RS/CRM / Out RE+NE si no se almacena | A2; consentimiento; entrega de leads; bajo-medio | Ruta puede ser estática, pero no decide destino |
| W08 | Clinic | área privada/login | `WEB_CUSTOM` | In GH, VE, RE, NE, AUTH / Out ST si no hay pagos | A3 parcial; seguridad; datos sensibles; alto | Ruta correcta; riesgos no sectoriales |
| W09 | Dealer | inventario persistente | `WEB_CUSTOM` | In GH, VE, RE, NE / Out ST si no hay pago | A3 parcial; migración/feed; consistencia; alto | Ruta correcta de forma general |
| W10 | Specialty | web app personalizada | `WEB_CUSTOM` | In GH, VE, RE, NE, JI, GD / condicionales | A3 parcial; arquitectura y secretos; alto | Ruta correcta, detalle insuficiente |
| W11 | Restaurant | ecommerce simple | `ECOMMERCE_PLATFORM` | In COM / Out RE+NE custom salvo necesidad | A2/M; cuenta/catalogo/pagos; proveedor; medio | `WEB_CUSTOM`: sobreaprovisiona |
| W12 | Specialty/Dealer | ecommerce avanzado | `ECOMMERCE_CUSTOM` o plataforma ampliada tras discovery | In COM o GH+VE+RE+NE+ST / exclusiones según decisión | A2-A3; fiscalidad, stock, envíos; alto | `WEB_CUSTOM`, pero sin señales de complejidad |

### 6.3 Booking

| ID | Sector/demo | Escenario y respuestas clave | Capacidades/ruta esperada | In / Out | Nivel; manual; riesgo; coste | Motor actual |
|---|---|---|---|---|---|---|
| B01 | Specialty | agenda básica; 1 calendario; sin pagos | `BOOKING_SAAS` | In BKS, GC? / Out GH, VE, RE, NE, ST | A2; crear cuenta; vendor lock-in; bajo | Siempre `BOOKING_CUSTOM`: fallo |
| B02 | Clinic | citas de un profesional | `BOOKING_SAAS` | In BKS, RS?, GC? / Out stack custom | A2; privacidad/configuración; bajo-medio | Sobreaprovisiona stack custom |
| B03 | Clinic | varios empleados | `BOOKING_SAAS` salvo reglas propias | In BKS, GC / Out stack custom por defecto | A2; calendarios individuales; medio | Siempre custom |
| B04 | Clinic/Dealer | varios servicios y duraciones | `BOOKING_SAAS` si catálogo soportado | In BKS / Out custom por defecto | A2; modelado de servicios; medio | Siempre custom |
| B05 | Restaurant/Clinic | varias ubicaciones | `BOOKING_SAAS` o custom según reglas cruzadas | In BKS; condicional custom / Out no decidido | A2; zonas horarias/recursos; medio-alto | Siempre custom sin preguntar |
| B06 | Restaurant/Clinic | depósito o pago | `BOOKING_SAAS` con payment o `BOOKING_CUSTOM` | In BKS+ST o custom+ST / Out según cobertura | A2; reembolsos/KYC; medio-alto | Custom+ST siempre |
| B07 | Restaurant | cancelación/reprogramación estándar | `BOOKING_SAAS` | In BKS, RS / Out stack custom por defecto | A2; política aprobada; medio | Siempre custom |
| B08 | Clinic | sincronización Google Calendar | `BOOKING_SAAS` + GC OAuth | In BKS, GC / Out RE+NE si no hacen falta | A2; OAuth propietario; conflicto de calendarios; medio | Custom; GC solo como módulo descriptivo |
| B09 | Restaurant | recursos/aforo/concurrencia compleja | `BOOKING_CUSTOM` | In GH, VE, RE, NE, RS; ST condicional | A3 parcial; pruebas de concurrencia; alto | Ruta adecuada, pero faltan señales estructuradas |

### 6.4 CRM

| ID | Sector/demo | Escenario y respuestas clave | Capacidades/ruta esperada | In / Out | Nivel; manual; riesgo; coste | Motor actual |
|---|---|---|---|---|---|---|
| C01 | Dealer | CRM básico de leads | `CRM_ALTAIRA` si se acepta producto propio | In Altaira, NE / Out repo/hosting nuevo | A3 interno; definir campos; medio | Ruta correcta |
| C02 | Dealer | pipeline comercial | `CRM_ALTAIRA` | In Altaira, NE; JI?/GD? | A3 interno; etapas aprobadas; medio | Ruta general correcta |
| C03 | Clinic | contactos/clientes | `CRM_ALTAIRA` con privacidad elevada | In Altaira, NE, AUTH / Out stack nuevo | A3 interno; base legal/permisos; medio-alto | Ruta correcta, riesgo sectorial insuficiente |
| C04 | Dealer | formularios conectados | `CRM_ALTAIRA` + webhook/form integration | In Altaira, webhook, web / Out stack nuevo si reutiliza Altaira | A2-A3; mapping y spam; medio | Ruta CRM, pero no crea item de integración |
| C05 | Clinic/Dealer | importación CSV | `CRM_ALTAIRA` + migración | In Altaira, NE, storage/GD / Out stack nuevo | A1/A2; limpieza/duplicados; medio-alto | Parcial; detecta migration/storage |
| C06 | Specialty | CRM con tareas | `CRM_ALTAIRA` + task module | In Altaira tasks / Out stack nuevo | A3 interno; ownership; medio | No pregunta ni deriva tareas |
| C07 | Dealer | CRM con automatizaciones | plan compuesto `CRM_ALTAIRA` + `AUTOMATION_*` | In Altaira + AUT/RS / Out según workflow | A2; límites/reintentos; alto | CRM gana y automation desaparece |
| C08 | Cualquier sector | CRM externo requerido | `CRM_EXTERNAL` | In EXT-CRM, migration/integration / Out Altaira CRM como sistema principal | A1/A2; cuenta/licencia/API; medio-alto | `CRM_ALTAIRA`: fallo crítico |
| C09 | Cuatro demos | CRM propio Altaira solicitado | `CRM_ALTAIRA` | In Altaira, NE, AUTH | A3 interno; permisos/training; medio | Ruta correcta |

### 6.5 Automation

| ID | Sector/demo | Escenario y respuestas clave | Capacidades/ruta esperada | In / Out | Nivel; manual; riesgo; coste | Motor actual |
|---|---|---|---|---|---|---|
| A01 | Restaurant | email automático simple | `AUTOMATION_MANAGED` | In RS + trigger; Out VE/NE si no se necesitan | A2/A3; plantilla/remitente; bajo | `WEB_CUSTOM`: fallo |
| A02 | Dealer | formulario -> CRM | `AUTOMATION_MANAGED` | In webhook + CRM + AUT / Out frontend nuevo si existe | A2; field mapping; duplicados; medio | `WEB_CUSTOM`: fallo |
| A03 | Clinic | calendario -> recordatorio | `AUTOMATION_MANAGED` | In GC + RS/AUT / Out stack custom por defecto | A2; OAuth/consentimiento; medio | `WEB_CUSTOM`: fallo |
| A04 | Specialty | factura/pago -> email | `AUTOMATION_MANAGED` o custom según criticidad | In payment webhook + RS/AUT / Out UI nueva | A2; eventos duplicados; medio-alto | `WEB_CUSTOM`: fallo |
| A05 | Dealer | lead -> tarea interna | automation interna Altaira | In Altaira CRM+Tasks / Out proveedor externo si innecesario | A3 interno; idempotencia; bajo-medio | `WEB_CUSTOM`: sobreaprovisiona |
| A06 | Specialty | integración entre apps | `AUTOMATION_MANAGED` | In Make/n8n/Zapier según decisión / Out custom si cubierto | A2; API limits; medio | `WEB_CUSTOM`: fallo |
| A07 | Clinic | workflow con aprobación humana | `AUTOMATION_MANAGED` + approval queue | In Altaira/AUT / Out ejecución directa sin aprobación | A2; permisos; alto | No modela aprobación |
| A08 | Cualquier sector | proceso crítico con reintentos | `AUTOMATION_CUSTOM` | In backend worker, DB/queue, observabilidad / Out SaaS simple si no garantiza | A3 parcial; reintentos/compensación; alto | Stack web genérico, sin job/queue |

### 6.6 Dashboard

| ID | Sector/demo | Escenario y respuestas clave | Capacidades/ruta esperada | In / Out | Nivel; manual; riesgo; coste | Motor actual |
|---|---|---|---|---|---|---|
| D01 | Restaurant | dashboard simple interno | `DASHBOARD_BI` | In BI + source / Out app custom si BI basta | A1/A2; definir KPIs; bajo-medio | `WEB_CUSTOM`: sobreaprovisiona |
| D02 | Dealer | dashboard comercial para cliente | `DASHBOARD_BI` o custom según embed/RLS | In BI/Auth / Out custom si embed seguro | A1/A2; acceso externo; medio-alto | Custom sin decidir BI |
| D03 | Specialty | KPIs agregados | `DASHBOARD_BI` | In BI / Out RE+NE si fuente existente | A1/A2; definición/quality; medio | `WEB_CUSTOM`: fallo |
| D04 | Clinic | conectado a PostgreSQL | `DASHBOARD_BI` con acceso read-only | In BI+Postgres / Out DB nueva | A2; datos sensibles; alto | Crea NE nueva aunque ya pueda existir |
| D05 | Dealer | GA/Search Console | `DASHBOARD_BI` tipo Looker Studio | In BI + Google OAuth / Out custom stack | A2; OAuth/cuotas; bajo-medio | `WEB_CUSTOM`: fallo |
| D06 | Specialty | realtime | `DASHBOARD_CUSTOM` o BI compatible | In GH/VE/RE/NE/realtime según SLA | A3 parcial; carga/latencia; alto | Ruta técnica cercana, pero no específica |
| D07 | Restaurant | exportable | `DASHBOARD_BI` | In BI con export / Out custom si cubierto | A1/A2; datos exportados; medio | No pregunta export |
| D08 | Clinic/Dealer | permisos por usuario | `DASHBOARD_BI` seguro o custom | In BI/Auth/RLS / Out acceso global | A2/A3; tenant leakage; alto | Custom genérico; sin modelo de roles |

### 6.7 Resultado global de la matriz

- Escenarios definidos: 46.
- Escenarios con fixture automatizado actual: 4.
- Casos con ruta razonable por el motor actual: web estática simple, web custom, booking realmente custom y CRM Altaira.
- Casos claramente mal encaminados: CMS, ecommerce simple, 8 booking SaaS, CRM externo, 8 automation y la mayoría de dashboards BI.
- Casos parciales: multilingüe, formularios, ecommerce avanzado, CRM con formularios/tareas/automation, realtime y permisos.
- Demos sectoriales compuestas: 4; ninguna está representada como plan compuesto.

No debe afirmarse un número exacto de “escenarios pasados” para los 46 hasta convertir esta matriz en tests ejecutables. El resultado honesto hoy es **4 casos automatizados pasados y 42 escenarios sin fixture específico**.

## 7. Auditoría de los seis formularios actuales

### 7.1 Limitación estructural

`LeadQuestion` solo admite:

```text
select | text | textarea
```

No admite `boolean`, `number`, `multiselect`, grupos repetibles, validación de unidad, `visibleWhen`, `requiredWhen`, fase qualification/discovery ni versión de regla.

### 7.2 General diagnostic

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `primaryGoal` | +3 al servicio principal | Bien formulada; select único | Permitir segundo objetivo solo en discovery |
| `onlinePresence` | +2 Web si none/basic/outdated | Correcta para qualification | Si working, preguntar URL y problema concreto |
| `bookingProcess` | +2 Booking si calls/messages o spreadsheet | Correcta; select | Si `booking_tool`, pedir nombre/satisfacción/API después |
| `leadProcess` | +2 CRM si messages/email o spreadsheet | Correcta; select | Si CRM, preguntar herramienta y problema después |
| `repetitiveWork` | +2 Automation si medium/high | Demasiado subjetiva; select + horas/semana opcional | Mostrar volumen numérico en discovery |
| `reporting` | +2 Dashboard si none/manual | Correcta para qualification | Si dashboard existe, preguntar fuente y limitación después |

Faltan en qualification:

- sector cerrado: Clinics, Car Dealers, Restaurants, Specialty;
- problema principal en una frase;
- urgencia aproximada;
- disponibilidad para discovery;
- presupuesto como banda opcional;
- si se tratan datos sensibles.

### 7.3 Web & SEO

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `currentWebsite` | solo se guarda | URL validada | Visible si existe web |
| `websiteState` | solo contexto | Select correcto | Debe afectar migration/redirect/SEO |
| `solutionShape` | static, custom o ecommerce | Útil, pero pide decisión técnica al cliente | En qualification usar objetivo; Altaira propone shape |
| `contentManagement` | activa CMS y fuerza custom | Boolean/unknown | Preguntar quién edita y frecuencia |
| `authentication` | activa auth/backend/database | Boolean/unknown | Si sí: usuarios, roles, invitación, datos |
| `dataPersistence` | activa database | Boolean/unknown demasiado técnico | Preguntar qué datos y por cuánto tiempo |
| `payments` | activa payments/backend | Boolean/unknown | Si sí: venta, depósito, suscripción, país |
| `externalIntegrations` | activa integración genérica | Multiselect de herramientas + `other` | Condicional por solución |
| `coreOffer` | solo contexto | Textarea breve | Correcta para contenido |
| `targetLocations` | solo contexto | Multiselect/text con país/idioma | Derivar SEO local y multilingual |
| `requiredPages` | solo contexto | Checklist + custom | Condicional al tipo de web |
| `contentReady` | solo contexto | Select | Debe generar tarea de contenido y riesgo |

Faltan:

- frecuencia de edición/blog;
- idiomas;
- formulario y destino de datos;
- catálogo/stock/envíos/fiscalidad para ecommerce;
- volumen y tipos de usuarios;
- ownership y preferencia SaaS/código;
- mantenimiento;
- analytics/Search Console;
- presupuesto y deadline;
- accesibilidad y requisitos legales;
- datos sensibles;
- tráfico/availability;
- migración SEO, redirects y dominio.

### 7.4 Booking

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `bookingType` | solo contexto | Select sectorial + `other` | Valores: appointment/table/room/vehicle/advisor/resource |
| `currentBookingProcess` | existing tool activa integrations | Select correcto | Si existing: nombre, API, export, motivo de cambio |
| `openingHours` | solo texto | Grupo estructurado día/inicio/fin | Permitir turnos y excepciones |
| `resources` | solo texto | Grupo repetible + capacidad numérica | Adaptado a clínica/restaurante/dealer |
| `slotDuration` | solo texto | Number + unidad | Condicional por servicio/recurso |
| `depositRequired` | activa payments | Boolean/unknown | Importe, política, reembolso y Stripe existente |

Faltan:

- número de profesionales/recursos;
- número de ubicaciones;
- catálogo de servicios y duraciones;
- buffers y antelación;
- cancelación/reprogramación/no-show;
- confirmación automática o manual;
- sincronización Google/Microsoft/Apple;
- notificaciones/canales;
- volumen mensual;
- cuentas de cliente/staff;
- datos sensibles;
- zona horaria e idiomas;
- preferencia SaaS vs custom;
- presupuesto y deadline.

### 7.5 CRM / Lead Management

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `currentLeadProcess` | existing CRM activa integrations | Select correcto | Si existing: nombre, API, export y motivo |
| `leadSources` | solo contexto | Multiselect + `other` | Debe generar conectores/formularios |
| `pipelineStages` | solo contexto | Lista ordenable | Prellenar por sector y permitir editar |
| `requiredFields` | solo contexto | Field builder simple | Incluir sensibilidad/obligatorio/visible |
| `monthlyVolume` | no deriva nada | Number | Usar bandas si el cliente no sabe |
| `importRequired` | activa migration y storage | Boolean/unknown | Formato, filas, calidad y ownership |

Faltan:

- `Altaira vs existing/external CRM`;
- usuarios y roles;
- tareas/recordatorios;
- automatizaciones;
- formularios/webhooks;
- notas/attachments;
- datos sensibles y base legal;
- duplicados e identidad de contacto;
- reporting;
- training/support;
- SLA/availability;
- presupuesto y ownership.

### 7.6 Workflow Automation

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `currentProcess` | activa automation por form key | Textarea útil | Añadir pasos actuales estructurados |
| `trigger` | solo contexto | Select evento/schedule/manual/webhook + detalle | Debe elegir arquitectura |
| `expectedAction` | solo contexto | Lista ordenada de acciones | Permitir condiciones |
| `channels` | integrations ya está siempre activo | Multiselect de apps, no credenciales | Preguntar disponibilidad API/OAuth |
| `monthlyVolume` | no deriva nada | Number | Debe afectar límites/coste |
| `failureHandling` | solo contexto | Select retry/alert/manual queue/stop + detalle | Debe activar criticidad y reintentos |

Faltan:

- apps origen/destino;
- criticidad;
- latencia/SLA;
- idempotencia;
- reintentos y compensación;
- aprobación humana;
- owner del error;
- auditoría;
- datos personales;
- scheduling;
- rate limits;
- preferencia Make/n8n/Zapier/custom;
- presupuesto.

### 7.7 Management Dashboard

| Pregunta actual | Decisión y derivación actual | Evaluación / tipo recomendado | Condición y dato faltante |
|---|---|---|---|
| `decisions` | solo contexto | Textarea breve | Convertir en outcomes medibles |
| `kpis` | solo contexto | Lista con definición/unidad | Requiere owner y fuente |
| `dataSources` | siempre activa external integrations si no está vacío | Multiselect estructurado | Tipo, acceso, frecuencia, calidad |
| `updateFrequency` | realtime activa realtime | Select correcto | Definir latencia real necesaria |
| `users` | solo contexto | Number + roles | Derivar auth/RLS/licencia |
| `currentReporting` | spreadsheet/manual activa migration | Select correcto | Si existing dashboard, pedir herramienta y carencia |

Faltan:

- herramienta preferida/actual;
- número de viewers/editors;
- interno/cliente/público;
- permisos por fila/cliente;
- exportación;
- alertas;
- embed;
- transformación y limpieza;
- histórico/retención;
- mobile;
- sensibilidad;
- presupuesto/licencias;
- ownership y soporte.

## 8. Qualification Intake vs Provisioning Discovery

### 8.1 Qualification Intake

Debe durar pocos minutos y responder:

- sector;
- problema principal;
- proceso actual;
- impacto/volumen aproximado;
- herramienta actual;
- objetivo;
- urgencia;
- servicio probable.

No debe preguntar por arquitectura, providers, secretos ni detalles exhaustivos.

### 8.2 Provisioning / Discovery Intake

Se abre después de que el lead esté cualificado y por cada track recomendado. Debe obtener:

- solución SaaS/configuración/custom;
- requisitos técnicos;
- datos, usuarios, permisos y sensibilidad;
- integraciones;
- ownership/mantenimiento;
- presupuesto y costes aceptables;
- deadline;
- migración;
- criterios de aceptación;
- recursos a crear;
- pasos manuales.

### 8.3 Progressive disclosure

Ejemplos:

```text
¿Necesita editar contenido?
  no  -> no mostrar CMS
  sí  -> frecuencia, editores, blog, idiomas

¿Usa booking actualmente?
  no  -> evaluar SaaS vs custom
  sí  -> herramienta, satisfacción, export/API, migración

¿Hay datos sensibles?
  no  -> flujo estándar
  sí  -> privacy review obligatorio y bloqueo de provision
```

## 9. Modelo de decisiones recomendado

```text
Raw Responses
  -> Schema validation
  -> Normalized Requirements
  -> Sector Policy
  -> Rule Evaluation
  -> Track Decisions[]
  -> Shared Resource Resolver
  -> Cost/Risk Evaluator
  -> Provisioning Plan Draft
  -> Admin Review
```

Cada regla debe devolver:

```text
ruleId
matchedSignals
derivedRequirement
decision
reason
confidence
requiresManualDecision
```

No se recomienda sustituir todo por un rules engine externo. Para el tamaño actual basta:

- reglas Java pequeñas e inmutables;
- `DecisionRule` por servicio;
- estrategias por ruta;
- tablas/versiones para plantillas;
- tests parametrizados.

La IA no debe decidir rutas ni costes. Puede ayudar a resumir respuestas, pero el plan debe ser determinista y explicable.

## 10. Cambios recomendados priorizados

### PE-001 - Separar plan global y decisiones por track

- **Archivo/clase afectada:** `ProvisioningDecisionEngine`, `ProvisioningDecision`, `ProvisioningPlanService`.
- **Problema detectado:** una sola ruta absorbe todos los servicios recomendados.
- **Por qué importa:** Clinics, Dealers y Restaurants suelen necesitar combinaciones; hoy se pierde parte del alcance.
- **Riesgo actual:** planes incompletos y recursos incorrectos.
- **Cambio recomendado:** `ProvisioningDecision` global con `TrackDecision[]` y `SharedResourceDecision[]`.
- **Prioridad:** CRITICAL.
- **Tipo:** refactor.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** golden fixtures de los cuatro sectores y snapshot del JSON actual.
- **Tests:** tests parametrizados de engine, controller y serialización.
- **Rollback:** feature flag `provisioning.engine.version=v1|v2`; conservar lectura v1.

### PE-002 - Ampliar el catálogo de rutas

- **Archivo/clase afectada:** `ProvisioningRoute`, `ProvisioningDecisionEngine`.
- **Problema detectado:** faltan CMS, ecommerce platform, booking SaaS, CRM externo, automation y BI.
- **Por qué importa:** el motor confunde configuración con desarrollo custom.
- **Riesgo actual:** sobreaprovisionamiento y costes innecesarios.
- **Cambio recomendado:** añadir rutas solo después de aprobar el catálogo de la sección 5.
- **Prioridad:** CRITICAL.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** tabla expected/actual de los 46 escenarios.
- **Tests:** uno por ruta y bordes SaaS/custom.
- **Rollback:** mantener enums v1 y mapper de compatibilidad.

### PE-003 - Reglas por servicio en lugar de cascada de `if`

- **Archivo/clase afectada:** `ProvisioningDecisionEngine`.
- **Problema detectado:** prioridad fija Booking > CRM > Static > Custom.
- **Por qué importa:** dificulta extensión y oculta combinaciones.
- **Riesgo actual:** cada nueva feature aumenta condiciones cruzadas.
- **Cambio recomendado:** interfaz `TrackDecisionPolicy` con implementaciones Web, Booking, CRM, Automation y Dashboard.
- **Prioridad:** HIGH.
- **Tipo:** extract.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** characterization tests de las cuatro rutas actuales.
- **Tests:** unitarios por policy y composición global.
- **Rollback:** conservar facade antigua delegando en policies.

### PE-004 - Sector Policy explícita

- **Archivo/clase afectada:** `ProvisioningRequirementNormalizer`, `SectorType`, nuevo contexto de decisión.
- **Problema detectado:** el sector existe en clientes/onboarding, pero no influye en el motor.
- **Por qué importa:** una clínica, un restaurante y un concesionario no comparten los mismos riesgos.
- **Riesgo actual:** recomendaciones genéricas y peligrosas con datos sensibles.
- **Cambio recomendado:** `DecisionContext(sector, requirements, responses)`; sector añade riesgos y preguntas, no herramientas arbitrarias.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** cuatro golden fixtures.
- **Tests:** mismas capacidades con distinto sector deben cambiar riesgos/pasos, no siempre la ruta.
- **Rollback:** sector opcional con fallback `CUSTOM`.

### PE-005 - Extender requisitos normalizados

- **Archivo/clase afectada:** `RequirementSet`, `ProvisioningRequirementNormalizer`.
- **Problema detectado:** faltan SaaS preference, budget, multilingual, sensitive data, multi-location, volume, approval y retry.
- **Por qué importa:** son las señales que separan una configuración simple de software custom.
- **Riesgo actual:** decisiones falsas por falta de información.
- **Cambio recomendado:** requisitos tipados, no solo booleans; por ejemplo `BudgetBand`, `DataSensitivity`, `OwnershipPreference`, `VolumeBand`.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** definir valores `UNKNOWN` y compatibilidad con assessments v1.
- **Tests:** normalización de valores, unknown y dependencias.
- **Rollback:** adapter de `RequirementSet` v1.

### PE-006 - Trazabilidad de reglas

- **Archivo/clase afectada:** `ProvisioningDecision`, DTOs y panel.
- **Problema detectado:** solo hay una explicación final.
- **Por qué importa:** el admin debe saber qué respuesta activó cada componente.
- **Riesgo actual:** decisiones difíciles de revisar o defender en el TFG.
- **Cambio recomendado:** almacenar `ruleId`, señales y razones por requisito/selección.
- **Prioridad:** HIGH.
- **Tipo:** document/refactor.
- **Riesgo de romper algo:** low.
- **Cómo validarlo antes de aplicar:** snapshot de respuesta API.
- **Tests:** toda herramienta seleccionada debe tener al menos una regla explicativa.
- **Rollback:** campo opcional en DTO.

### PE-007 - Coste, riesgo y nivel de automatización reales

- **Archivo/clase afectada:** `ProvisioningDecision`, providers dry-run.
- **Problema detectado:** coste es texto genérico y todos los planes son A3 parcial.
- **Por qué importa:** A3 parece afirmar capacidad de ejecución que no existe.
- **Riesgo actual:** confianza incorrecta en el plan.
- **Cambio recomendado:** `CostBand`, `AutomationReadiness` y nivel por step; distinguir `PLANNABLE` de `EXECUTABLE`.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** inventario de provider capabilities.
- **Tests:** provider dry-run nunca debe reportar ejecución permitida.
- **Rollback:** mantener campos de texto de compatibilidad.

### PE-008 - Versionar planes aprobados

- **Archivo/clase afectada:** `ProvisioningPlanService#generateDryRun`, entidades.
- **Problema detectado:** regenerar reemplaza hijos y vuelve a `draft`.
- **Por qué importa:** puede borrar el contexto de un plan revisado.
- **Riesgo actual:** pérdida de trazabilidad de aprobación.
- **Cambio recomendado:** un plan aprobado es inmutable; regenerar crea revisión `version + 1`.
- **Prioridad:** CRITICAL.
- **Tipo:** refactor.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** probar draft, awaiting, approved y nueva revisión.
- **Tests:** nunca mutar plan aprobado; historial conservado.
- **Rollback:** copia de datos y endpoint v1 read-only.

### PE-009 - Idempotency key de negocio

- **Archivo/clase afectada:** `ProvisioningPlanService#replacePlanDetails`.
- **Problema detectado:** la clave usa posición del item.
- **Por qué importa:** reordenar items puede duplicar recursos en ejecución futura.
- **Riesgo actual:** bajo en dry-run, crítico al activar APIs.
- **Cambio recomendado:** hash estable de client/track/provider/resourceType/purpose/templateVersion.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** reordenar items y comprobar misma clave.
- **Tests:** estabilidad, unicidad y colisiones.
- **Rollback:** conservar `legacyIdempotencyKey`.

### PE-010 - Suite de escenarios

- **Archivo/clase afectada:** tests de provisioning.
- **Problema detectado:** 4 casos efectivos no cubren 46 escenarios.
- **Por qué importa:** el motor puede compilar y decidir mal.
- **Riesgo actual:** regresión silenciosa.
- **Cambio recomendado:** fixtures declarativos y tests parametrizados expected/actual.
- **Prioridad:** CRITICAL.
- **Tipo:** test.
- **Riesgo de romper algo:** low.
- **Cómo validarlo antes de aplicar:** aprobar primero decisiones de negocio abiertas.
- **Tests:** 46 escenarios + 4 planes sectoriales compuestos + unknown/conflictos.
- **Rollback:** no aplica; tests aislados.

### FORM-001 - Separar qualification y discovery

- **Archivo/clase afectada:** `lib/lead-intake.ts`, `AdminLeadIntake.tsx`, DTOs assessment.
- **Problema detectado:** preguntas comerciales y técnicas conviven en una lista plana.
- **Por qué importa:** intake largo y decisiones técnicas prematuras.
- **Riesgo actual:** respuestas poco fiables.
- **Cambio recomendado:** schemas versionados por fase y track.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** conservar lectura de schema version 1.
- **Tests:** validación por fase, campos obligatorios condicionales y resume.
- **Rollback:** servir definitions v1.

### FORM-002 - Tipos y condiciones de pregunta

- **Archivo/clase afectada:** `LeadQuestion`, `QuestionField`.
- **Problema detectado:** solo select/text/textarea.
- **Por qué importa:** horarios, volumen, ubicaciones y apps se guardan como texto ambiguo.
- **Riesgo actual:** normalización frágil.
- **Cambio recomendado:** number, boolean, multiselect, URL, repeated group y `visibleWhen`.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** renderer por tipo y validación Zod/servidor equivalente.
- **Tests:** accessibility, teclado, condicionales y payload.
- **Rollback:** fallback renderer de texto.

### BE-001 - Reorganización por feature, incremental

- **Archivo/clase afectada:** paquetes `controller`, `service`, `repository`, `dto`.
- **Problema detectado:** estructura horizontal plana con muchos dominios mezclados.
- **Por qué importa:** difícil localizar una feature completa y controlar dependencias.
- **Riesgo actual:** imports cruzados y servicios compartidos accidentales.
- **Cambio recomendado:** migrar una feature cada vez a `lead`, `client`, `workspace`, `onboarding`, `task`, `provisioning`, `notification`, `shared`.
- **Prioridad:** MEDIUM.
- **Tipo:** move.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** mover solo una feature por PR.
- **Tests:** build completo, context load y tests de endpoints afectados.
- **Rollback:** revert del PR de una feature.

### BE-002 - Extraer responsabilidades de servicios grandes

- **Archivo/clase afectada:** `ClientCrmLeadService`, `ClientPortalService`, `LeadNotificationService`, `OnboardingService`.
- **Problema detectado:** mezcla dominio, persistencia, mapeo y transporte.
- **Por qué importa:** baja cohesión y alto riesgo de regresión.
- **Riesgo actual:** cambios de UI/permisos rompen persistencia.
- **Cambio recomendado:** extraer mappers, policy de visibilidad, payload renderer, storage y audit service.
- **Prioridad:** HIGH.
- **Tipo:** extract.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** characterization tests de respuestas actuales.
- **Tests:** admin vs client visibility, mapping y notificaciones.
- **Rollback:** facade original delegando progresivamente.

### BE-003 - Principal de auditoría no nullable

- **Archivo/clase afectada:** `AdminAccessService`, servicios que reciben `AppUserEntity`.
- **Problema detectado:** un internal token válido devuelve `null` como usuario.
- **Por qué importa:** `createdBy` puede quedar vacío y la auditoría es ambigua.
- **Riesgo actual:** trazabilidad incompleta.
- **Cambio recomendado:** `ActorContext` con tipo USER/SERVICE y actorId estable.
- **Prioridad:** HIGH.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** endpoints con cookie admin e internal token.
- **Tests:** eventos/tareas con ambos actores.
- **Rollback:** adapter que traduzca actor usuario al contrato antiguo.

### BE-004 - Excepciones de dominio consistentes

- **Archivo/clase afectada:** `GlobalExceptionHandler` y services.
- **Problema detectado:** uso mixto de `IllegalArgumentException`, `IllegalStateException` y `ResponseStatusException`.
- **Por qué importa:** errores de dominio pueden convertirse en 500 genérico.
- **Riesgo actual:** API poco predecible.
- **Cambio recomendado:** errores tipados con código estable y respuesta uniforme.
- **Prioridad:** MEDIUM.
- **Tipo:** refactor.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** contrato de errores actual.
- **Tests:** 400/401/403/404/409 y no exposición de secretos.
- **Rollback:** handlers compatibles.

### BE-005 - Migraciones versionadas

- **Archivo/clase afectada:** `backend/database/*.sql`, `pom.xml`.
- **Problema detectado:** SQL manual sin historial automático.
- **Por qué importa:** schema drift entre local, test y Neon.
- **Riesgo actual:** despliegue con tabla/constraint ausente.
- **Cambio recomendado:** evaluar Flyway; baseline del schema real antes de mover scripts.
- **Prioridad:** HIGH.
- **Tipo:** dependency.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** inventario exacto de Neon y checksum; nunca aplicar a ciegas.
- **Tests:** DB limpia, DB con baseline y migración incremental.
- **Rollback:** backup + scripts manuales conservados hasta estabilización.

### BE-006 - Eliminar workarounds de AppleDouble solo tras prueba

- **Archivo/clase afectada:** `pom.xml`, scripts `clean:appledouble`.
- **Problema detectado:** `spring.classformat.ignore=true` en runtime/tests oculta clases inválidas.
- **Por qué importa:** puede esconder artefactos corruptos reales.
- **Riesgo actual:** diagnóstico más difícil y dependencia del filesystem.
- **Cambio recomendado:** limpiar `._*`, validar build limpio y retirar el flag en una rama.
- **Prioridad:** MEDIUM.
- **Tipo:** dependency.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** `find`, clean build y arranque local.
- **Tests:** Maven test/package/run.
- **Rollback:** restaurar temporalmente el flag.

### FE-001 - Dividir componentes por feature y responsabilidad

- **Archivo/clase afectada:** `AdminOnboardingReview.tsx`, `ClientDashboardShell.tsx`, `AdminTasks.tsx`, páginas de client operations.
- **Problema detectado:** UI, fetch, tipos y dominio en el mismo archivo.
- **Por qué importa:** difícil revisar y probar.
- **Riesgo actual:** estados inconsistentes y efectos laterales.
- **Cambio recomendado:** componentes de presentación + hooks + API client + schemas por feature.
- **Prioridad:** HIGH.
- **Tipo:** extract.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** snapshots visuales y contrato de API.
- **Tests:** lint, tsc, build y smoke por ruta.
- **Rollback:** extraer una sección por PR.

### FE-002 - Tipos compartidos de API

- **Archivo/clase afectada:** tipos `ClientPortal`, `OnboardingTask`, `ClientCrmLead`, `WorkspaceTask`, `Lead`.
- **Problema detectado:** definiciones duplicadas en múltiples componentes/páginas.
- **Por qué importa:** el backend puede cambiar sin error en todos los consumidores.
- **Riesgo actual:** drift de campos y estados.
- **Cambio recomendado:** `features/*/contracts.ts`; idealmente generar o validar contratos.
- **Prioridad:** HIGH.
- **Tipo:** extract.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** comparar todas las variantes.
- **Tests:** tsc y fixtures JSON.
- **Rollback:** re-export aliases por ubicación antigua.

### FE-003 - Cliente HTTP y manejo de errores común

- **Archivo/clase afectada:** componentes con `fetch` directo y `app/api` proxies.
- **Problema detectado:** parsing, 401, loading y errores se repiten.
- **Por qué importa:** comportamientos distintos ante la misma respuesta.
- **Riesgo actual:** errores silenciosos y redirecciones inconsistentes.
- **Cambio recomendado:** cliente tipado por ámbito admin/client, sin mover secretos al browser.
- **Prioridad:** MEDIUM.
- **Tipo:** extract.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** mantener proxies Next server-side.
- **Tests:** 401, timeout, invalid JSON y error backend.
- **Rollback:** wrapper por endpoint, no reemplazo masivo.

### FE-004 - Normalizar rutas administrativas

- **Archivo/clase afectada:** `/admin/*`, `/leads/*`, `/clients/*`, middleware.
- **Problema detectado:** parte del admin vive fuera de `/admin`.
- **Por qué importa:** navegación y reglas de protección menos claras.
- **Riesgo actual:** omitir una ruta en matcher o breadcrumbs inconsistentes.
- **Cambio recomendado:** decidir entre conservar rutas públicas actuales con route groups o migrar a `/admin/leads` y `/admin/clients`.
- **Prioridad:** MEDIUM.
- **Tipo:** move.
- **Riesgo de romper algo:** high.
- **Cómo validarlo antes de aplicar:** mapa de enlaces, redirects y bookmarks.
- **Tests:** middleware, login y navegación profunda.
- **Rollback:** redirects permanentes/temporales.

### FE-005 - Accesibilidad y formularios progresivos

- **Archivo/clase afectada:** `AdminLeadIntake`, filtros/modales admin.
- **Problema detectado:** renderer plano; validación semántica limitada.
- **Por qué importa:** formularios largos y errores difíciles.
- **Riesgo actual:** datos incompletos y navegación teclado irregular.
- **Cambio recomendado:** fieldsets, legend, resumen de errores, focus management y condiciones anunciadas.
- **Prioridad:** MEDIUM.
- **Tipo:** refactor.
- **Riesgo de romper algo:** low.
- **Cómo validarlo antes de aplicar:** teclado y lector básico.
- **Tests:** lint accessibility, Playwright y submit.
- **Rollback:** mantener renderer actual tras feature flag.

### DEP-001 - Podar dependencias y componentes UI no alcanzables

- **Archivo/clase afectada:** `package.json`, `components/ui`.
- **Problema detectado:** varias dependencias solo aparecen en componentes UI que no tienen consumidores.
- **Por qué importa:** superficie de mantenimiento y actualizaciones.
- **Riesgo actual:** bajo; el borrado precipitado puede romper imports dinámicos futuros.
- **Cambio recomendado:** reachability audit; candidatos iniciales: `@hookform/resolvers`, `zod`, `date-fns`, analytics/speed-insights y Radix no usado.
- **Prioridad:** LOW.
- **Tipo:** dependency.
- **Riesgo de romper algo:** medium.
- **Cómo validarlo antes de aplicar:** búsqueda global, import graph, rama temporal, build y recorrido visual.
- **Tests:** lint, tsc, build y smoke público/admin/client.
- **Rollback:** restaurar package/lock y componentes.

### DOC-001 - ADRs y Javadoc en límites críticos

- **Archivo/clase afectada:** provisioning, auth, tenant access, onboarding.
- **Problema detectado:** decisiones críticas existen solo en código/reportes.
- **Por qué importa:** difícil explicar por qué una regla o límite existe.
- **Riesgo actual:** cambios futuros contradicen la intención.
- **Cambio recomendado:** ADR corto para tenancy, plan/execution, sector policy y task truth; Javadoc solo en contratos críticos.
- **Prioridad:** LOW.
- **Tipo:** document.
- **Riesgo de romper algo:** low.
- **Cómo validarlo antes de aplicar:** revisión técnica.
- **Tests:** no aplica; enlaces y ejemplos deben coincidir con código.
- **Rollback:** no necesario.

## 11. Código sospechoso de no usarse

La búsqueda global no encontró imports ni renderizado de:

| Archivo | Contenido | Riesgo funcional | Recomendación |
|---|---|---|---|
| `components/Examples.tsx` | mockups antiguos de web, booking y dashboard | métricas y diseño ya superados | delete later |
| `components/BusinessTypes.tsx` | Dealers, Hair Salons, Bike Shops, Restaurants, Clinics | contiene sectores retirados | delete later |
| `components/Pricing.tsx` | precios fijos Starter/Growth/Pro | precios no aprobados y VAT afirmado | delete later |
| `components/Results.tsx` | +40%, 50+ negocios y testimonios ficticios | contradice política de no inventar datos | delete later |

No deben borrarse directamente. Procedimiento:

1. confirmar referencias con `rg`;
2. generar import graph;
3. desactivar en rama temporal;
4. ejecutar lint/tsc/build;
5. revisar home y rutas públicas;
6. solo entonces borrar;
7. conservar la información reutilizable válida en datos actuales, no copiando claims ficticios.

También hay numerosos `components/ui/*` sin consumidor aparente. Son candidatos, no código muerto confirmado.

## 12. Imports y dependencias a revisar

### Candidatos frontend

La búsqueda directa no encontró uso de:

- `@hookform/resolvers`;
- `zod`;
- `date-fns`;
- `@vercel/analytics`;
- `@vercel/speed-insights`.

Observaciones:

- `tailwindcss-animate` sí se usa en `tailwind.config.ts`.
- `autoprefixer` figura como dependencia, pero no aparece en `postcss.config.mjs`; confirmar comportamiento de build antes de retirar.
- muchas dependencias Radix aparecen solo dentro de componentes UI sin referencias.
- `react-hook-form` parece limitado al componente UI `form`; confirmar reachability real.

### Backend

- AWS S3 SDK sí tiene uso futuro/actual en media upload URL; no retirar sin revisar `MediaUploadUrlService`.
- Spring Mail sigue siendo fallback SMTP; no retirar mientras el provider smtp sea soportado.
- PDFBox se usa para evidencia de firma; no retirar.
- Bucket4j se usa para rate limiting; confirmar configuración antes de actualizar.
- el warning de `commons-logging.jar` durante tests debe investigarse con `mvn dependency:tree`, no excluir a ciegas.

## 13. Organización backend propuesta

Migración gradual, no big-bang:

```text
com.altaira.backend
├── shared
│   ├── config
│   ├── security
│   ├── error
│   └── json
├── lead
│   ├── api
│   ├── application
│   ├── domain
│   └── infrastructure
├── client
├── workspace
├── task
├── onboarding
├── provisioning
│   ├── api
│   ├── application
│   ├── domain
│   │   ├── requirements
│   │   ├── rules
│   │   └── plan
│   └── infrastructure
│       └── provider
└── notification
```

Reglas:

- controller solo HTTP/auth/input/output;
- application service orquesta casos de uso;
- domain contiene decisiones puras;
- repository adapters persisten;
- mapper traduce entidad/DTO;
- provider execution nunca participa en `decide`;
- módulos pueden depender de `shared`, no de controllers de otros módulos.

No hace falta imponer interfaces a cada service. Úselas en límites con varias implementaciones: providers, policies, storage, notification y clocks/IDs en tests.

## 14. Organización frontend propuesta

```text
app
├── (public)
├── admin
└── client

features
├── leads
│   ├── api
│   ├── components
│   ├── hooks
│   ├── schemas
│   └── contracts.ts
├── clients
├── tasks
├── onboarding
├── provisioning
└── client-portal

components
├── ui
└── shared

lib
├── server
└── shared
```

Separación recomendada:

- `app/*`: composición y routing;
- `features/*/api`: calls y parsing;
- `features/*/hooks`: estado remoto/local;
- `features/*/components`: UI de feature;
- `contracts.ts`: tipos compartidos;
- `components/ui`: primitivas sin negocio.

No mover todo a la vez. Empezar por Provisioning, porque está relativamente aislado y necesita tests nuevos.

## 15. Angular vs Next.js

### Ventajas potenciales de Angular

- estructura opinionada;
- DI y formularios robustos;
- patrones claros para aplicaciones administrativas grandes;
- tooling consistente para equipos numerosos.

### Costes y riesgos

- reescritura completa de rutas, auth, componentes y proxies;
- duplicación temporal de frontend;
- pérdida de velocidad en el TFG;
- dos ecosistemas en un equipo pequeño;
- no resuelve por sí mismo God components ni reglas de dominio;
- el hecho de usar TypeScript no hace la migración barata.

### Recomendación

Mantener Next.js/React. El problema actual es organización interna, no capacidad del framework. Angular solo tendría sentido en el futuro si:

- existe un equipo separado;
- el admin se convierte en producto independiente;
- hay presupuesto para migración;
- se justifica con requisitos que Next.js no cubra de forma razonable.

No aporta valor suficiente al TFG actual.

## 16. Cambios que NO se recomiendan ahora

- Conectar `Confirm and provision`.
- Crear providers nuevos.
- Ejecutar Jira, GitHub, Drive, Vercel, Render, Neon o Make/n8n.
- Migrar a Angular.
- Reorganizar todos los paquetes en un solo cambio.
- Reescribir el motor con IA.
- Borrar componentes o dependencias por conteo de imports solamente.
- Sustituir el CRM Altaira por un producto externo sin decisión comercial.
- Hacer que todos los clientes creen repositorio, Jira y Drive obligatoriamente.
- Guardar secretos en intake, plan o base de datos.
- Aplicar migraciones manuales a Neon durante esta fase.

## 17. Plan seguro de ejecución

### Fase 0 - Decisiones de negocio

Aprobar:

1. catálogo de rutas;
2. default SaaS vs custom;
3. CRM Altaira vs externo;
4. herramientas permitidas por categoría;
5. significado A3/A2/A1/M;
6. recursos obligatorios/opcionales;
7. bandas de coste;
8. tratamiento de datos sensibles de clínicas.

### Fase 1 - Characterization y matriz

- convertir 46 escenarios en fixtures;
- añadir 4 golden demos sectoriales;
- capturar comportamiento actual;
- no cambiar engine aún.

### Fase 2 - Formularios versionados

- separar qualification/discovery;
- añadir tipos condicionales;
- conservar assessments v1;
- añadir sector cerrado.

### Fase 3 - Motor v2 puro

- policies por track;
- plan compuesto;
- rutas nuevas;
- trazabilidad de reglas;
- sin providers ejecutables.

### Fase 4 - Persistencia segura

- planes versionados;
- aprobación inmutable;
- idempotency keys estables;
- migration versionada tras backup y aprobación.

### Fase 5 - UI de revisión

- answers;
- requisitos;
- track decisions;
- herramientas incluidas/excluidas;
- costes/riesgos;
- manual steps;
- comparación de revisiones.

### Fase 6 - Limpieza arquitectónica

- extraer mappers/policies/hooks;
- reducir God classes por una feature;
- normalizar contratos;
- revisar dead code y dependencias.

### Fase 7 - Ejecución futura

Solo tras validación:

- jobs;
- estados por step;
- retries;
- external resource IDs;
- compensaciones;
- providers uno a uno;
- límites de coste y aprobación.

## 18. Regla de seguridad para borrar o mover

### Borrar

1. detectar candidato;
2. buscar referencias directas, alias y dinámicas;
3. comprobar rutas y tests;
4. desactivar en una rama;
5. ejecutar validaciones;
6. hacer recorrido visual;
7. borrar en PR aislada;
8. rollback con revert.

### Mover

1. definir paquete/carpeta destino;
2. listar imports afectados;
3. mover una unidad cohesiva;
4. compilar;
5. ejecutar tests de módulo;
6. ejecutar build completo;
7. validar rutas web;
8. no mezclar con cambios funcionales.

## 19. Checklist de validación antes y después

### Backend

```bash
cd backend
./mvnw test
./mvnw package -DskipTests
./mvnw -Dtest='BackendApplicationTests#generatesIdempotentStaticWebsiteProvisioningDryRun+generatesCustomApplicationProvisioningDryRunWithoutExecutingProviders+generatesSectorAlignedClinicCrmAndRestaurantBookingPlans' test
```

Cuando exista la matriz v2:

```bash
./mvnw -Dtest='ProvisioningDecisionEngineScenarioTests' test
```

### Frontend

```bash
npm run lint
npx tsc --noEmit
npm run build
```

### Calidad del diff

```bash
git diff --check
git status --short
```

### Validación funcional

- admin login;
- lead inbox;
- crear intake general;
- crear intake específico;
- recommendation;
- lead detail;
- conversion;
- provisioning plan dry-run;
- cambio de estado del plan;
- client list/detail;
- Open workspace;
- client workspace real;
- admin tasks;
- client tasks;
- calendar derivado de tasks;
- preview as client;
- confirmar que notas/admin-only no se filtran;
- contacto público y Resend sin modificar configuración.

## 20. Decisiones que requieren aprobación del propietario

No deben asumirse:

1. ¿Web editable debe priorizar WordPress, Webflow, Wix u otra opción?
2. ¿Ecommerce simple debe priorizar Shopify o WooCommerce?
3. ¿Booking simple debe priorizar Cal.com, Calendly, SimplyBook, Microsoft Bookings u otra opción?
4. ¿Cuándo se vende CRM Altaira y cuándo HubSpot/Odoo/Zoho/Dolibarr/SuiteCRM?
5. ¿Automation managed prioriza n8n, Make o Zapier?
6. ¿Dashboard BI prioriza Looker Studio, Metabase, Power BI o Superset?
7. ¿GitHub, Jira y Drive son obligatorios o dependen del tamaño del proyecto?
8. ¿Qué niveles de presupuesto se usarán?
9. ¿Qué significa exactamente A3/A2/A1/M comercial y técnicamente?
10. ¿Qué datos de clínicas se permitirá almacenar en Altaira?
11. ¿Qué servicios pueden venderse sin código propio?
12. ¿Qué coste recurrente necesita aceptación explícita?

Hasta responderlas, las rutas nuevas deben marcarse `REQUIRES_BUSINESS_DECISION`, no elegir un proveedor automáticamente.

## 21. Recomendación final

El motor actual es una buena **prueba de concepto dry-run**, no un decisor de producción.

Está listo para:

- guardar planes;
- mostrar inclusión/exclusión;
- demostrar seguridad sin ejecución;
- servir de base al TFG.

No está listo para:

- decidir entre SaaS/CMS/custom;
- componer varios servicios;
- estimar costes;
- representar los cuatro sectores con suficiente profundidad;
- aprovisionar recursos externos;
- activar `Confirm and provision`.

El siguiente bloque correcto, tras validar este documento, es:

1. aprobar el catálogo de rutas y decisiones abiertas;
2. implementar **solo tests parametrizados** de los 46 escenarios y 4 demos sectoriales;
3. medir expected vs actual;
4. después diseñar Engine v2 sin providers ejecutables.

Ese orden evita construir automatización sobre decisiones equivocadas y mantiene el proyecto defendible, seguro y económicamente sensato.
