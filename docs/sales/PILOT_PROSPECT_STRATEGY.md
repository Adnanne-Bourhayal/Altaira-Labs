# Pilot Prospect Strategy

> Estado: estrategia comercial previa a cualquier prospección.
>
> Las cuatro empresas mencionadas son demos ficticias. No son clientes ni
> prospectos reales confirmados.

## 1. Objetivo

Preparar entre tres y cinco pilotos limitados con pequeños negocios de Bélgica o
España para validar la propuesta de Altaira Labs sin presentar ejemplos ficticios
como resultados reales.

El intercambio recomendado es:

- Altaira entrega un piloto con alcance, duración y límites escritos;
- el negocio aporta información, tiempo de revisión y feedback honesto;
- el permiso para publicar el caso se solicita por separado;
- el testimonio solo se solicita si el negocio queda satisfecho y siempre es
  opcional;
- cualquier referencia pública requiere aprobación expresa del texto, nombre,
  logotipo y materiales que se vayan a publicar.

No se prometen incrementos de ventas, ahorro o captación sin medición real.

## 2. Sectores prioritarios

| Prioridad | Sector | Demo ficticia | Problema inicial a validar | Oferta piloto probable |
|---|---|---|---|---|
| 1 | Clínicas dentales o estéticas pequeñas | Iberia Dental Demo | citas manuales, seguimiento disperso y web poco clara | diagnóstico, flujo de reservas y CRM ligero sin almacenar datos clínicos en el piloto |
| 2 | Concesionarios o compraventa familiar | Hispano Motors Demo | inventario difícil de actualizar y leads sin seguimiento | página de inventario demostrativa, formulario y pipeline comercial |
| 3 | Restaurantes, tapas bar o cafeterías latinas | Tapas Bistro Demo | reservas por varios canales, menú desactualizado y SEO local débil | web editable, reserva demostrativa y recordatorios |
| 4 | Servicios profesionales para hispanohablantes | Asesoría Hispana Demo | formularios, documentos y tareas repartidos entre email y Drive | intake, CRM ligero, estructura documental y dashboard básico |

La segmentación se basa en servicio, ubicación, idioma público y necesidad
operativa. No se debe inferir nacionalidad, origen étnico, salud, religión u otras
características personales a partir del nombre o de la apariencia de una persona.

## 3. Cómo encontrar candidatos

Usar primero canales con relación o intención demostrable:

1. Referencias de conocidos, asociaciones empresariales y clientes potenciales que
   hayan pedido información.
2. Cámaras de comercio, asociaciones horeca, redes de emprendedores, eventos
   locales y encuentros profesionales.
3. Formularios de interés propios, LinkedIn de Altaira y contenido público que
   invite al negocio a solicitar un diagnóstico.
4. Búsqueda manual de páginas web corporativas y directorios empresariales
   legítimos para identificar el negocio, no para extraer listas masivas.
5. Visita o llamada individual al canal comercial publicado por el negocio,
   únicamente después de revisar las reglas aplicables al país y al canal.

### No permitido

- raspar Google Maps;
- comprar o descargar listas de emails;
- automatizar extracción masiva desde LinkedIn, directorios o redes sociales;
- recopilar emails personales, teléfonos privados o perfiles de empleados;
- enviar campañas masivas sin consentimiento o revisión jurídica;
- fingir una relación previa;
- guardar datos porque “podrían ser útiles”;
- presentar un candidato, piloto o demo como cliente antes de tener permiso.

## 4. Registro en Altaira CRM

### Estados recomendados

```text
researched
  -> eligibility_review
  -> contact_allowed
  -> contacted
  -> responded
  -> discovery
  -> pilot_proposed
  -> pilot_accepted
  -> pilot_active
  -> completed

Alternativas: declined | not_a_fit | do_not_contact
```

`researched` no equivale a lead cualificado. `pilot_accepted` tampoco convierte al
negocio automáticamente en referencia pública.

### Datos que se pueden guardar

Solo cuando sean necesarios y exista una base jurídica documentada:

- nombre comercial y razón social;
- sector y localidad;
- URL corporativa;
- canal de contacto empresarial publicado;
- idioma comercial publicado;
- fuente exacta y fecha de consulta;
- necesidad operativa observada, descrita sin inferencias personales;
- responsable interno de Altaira;
- estado, fecha y resultado de cada contacto;
- base jurídica y revisión del canal;
- información proporcionada directamente durante discovery;
- consentimiento o autorización de portfolio, cuando exista;
- oposición y estado `do_not_contact`.

Una dirección como `nombre.apellido@empresa` puede identificar a una persona y debe
tratarse como dato personal. Un correo genérico como `info@empresa` reduce el
riesgo, pero no elimina las obligaciones sobre comunicaciones comerciales.

### Datos que no se deben guardar

- datos de pacientes, tratamientos o salud;
- DNI, documentos de identidad o información financiera del prospecto;
- teléfonos o emails personales no facilitados para la relación comercial;
- contraseñas, API keys o accesos;
- copias completas de reseñas o perfiles sociales;
- nacionalidad, etnia, religión, orientación política o inferencias equivalentes;
- información sobre familiares o empleados no implicados;
- listas obtenidas mediante scraping;
- notas subjetivas, despectivas o no verificables;
- datos indefinidos “por si acaso”.

Aplicar retención limitada: revisar candidatos sin actividad, eliminar lo que ya no
sea necesario y conservar una lista mínima de supresión para respetar oposiciones.

## 5. GDPR y ePrivacy

Esta sección es una guía operativa, no asesoramiento jurídico. Antes de hacer
outreach en Bélgica o España se debe confirmar la ley nacional aplicable al canal,
tipo de destinatario y relación previa.

Principios mínimos:

- definir una base jurídica antes de tratar datos personales;
- informar de identidad, finalidad, fuente y derechos como máximo en el primer
  contacto cuando los datos no vienen de la persona;
- minimizar datos y limitar la conservación;
- ofrecer oposición o baja clara, gratuita y sencilla;
- no volver a contactar tras una oposición;
- no confundir “interés legítimo” del GDPR con autorización automática para enviar
  email comercial bajo ePrivacy;
- identificar siempre a Altaira y proporcionar un canal válido de respuesta.

Fuentes oficiales:

- El [GDPR, artículos 5, 14 y 21](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
  establece transparencia, minimización, información cuando los datos se obtienen
  indirectamente y oposición al marketing directo.
- El [artículo 13 de la Directiva ePrivacy](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058)
  regula comunicaciones electrónicas no solicitadas, exige identificar al remitente
  y un canal válido para cesar mensajes.
- La [Autoridad de Protección de Datos belga](https://www.dataprotectionauthority.be/index.php/citizen/themes/marketing)
  considera marketing directo las comunicaciones promocionales dirigidas que
  implican datos personales y publica su recomendación y checklist actualizadas.
- El [EDPB sobre bases jurídicas](https://www.edpb.europa.eu/topics/key-gdpr-concepts/legal-basis_en)
  recuerda que toda operación debe apoyarse en una de las bases del artículo 6 y
  que los datos sensibles tienen condiciones adicionales.

### Canal recomendado para el primer piloto

Priorizar introducción, evento, formulario entrante o consentimiento explícito. Si
se valora contacto frío B2B individual, registrar antes:

- país y norma revisada;
- fuente del dato;
- destinatario y carácter empresarial del canal;
- interés legítimo evaluado cuando corresponda;
- mensaje relevante y no masivo;
- información de privacidad;
- mecanismo de oposición;
- máximo de intentos permitido.

Sin esta revisión, el estado debe permanecer `eligibility_review`.

## 6. Oferta de piloto gratuito

El piloto gratuito elimina la tarifa inicial de implantación únicamente para un
alcance cerrado. No convierte en gratuitos el dominio, las licencias, la publicidad,
el consumo de proveedores ni el trabajo posterior que quede fuera de ese alcance.

### Alcance

Un piloto debe resolver un único problema demostrable. No debe prometer la
plataforma completa ni usar datos sensibles en una demo.

Ejemplo de paquete:

1. sesión de diagnóstico;
2. mapa del proceso actual;
3. prototipo o configuración limitada;
4. una integración o flujo principal;
5. una ronda de feedback;
6. entrega y recomendación de siguiente fase.

### Condiciones

- coste de implantación del alcance piloto: gratuito si se aprueba así;
- licencias, dominio, publicidad o consumo de terceros: a cargo del negocio o
  aprobados expresamente antes de incurrir en coste;
- alcance, responsables, datos, duración y criterio de finalización por escrito;
- sin garantía de ventas o resultados;
- sin producción con datos reales hasta aprobar seguridad y tratamiento;
- soporte y cambios fuera de alcance se cotizan aparte;
- Altaira puede detener el piloto si falta acceso legítimo, consentimiento o
  colaboración necesaria.

### Feedback, portfolio y testimonio

Separar tres decisiones:

| Decisión | Condición |
|---|---|
| Feedback privado | parte normal del piloto |
| Caso de portfolio | autorización expresa con alcance y materiales aprobados |
| Testimonio o referencia pública | opcional, texto aprobado y solo tras satisfacción real |

No condicionar el funcionamiento del piloto a un testimonio positivo. Si no hay
permiso público, el caso permanece privado y no aparece en la web.

## 7. Flujo operativo

```text
Candidate research
  -> compliance/fit review
  -> approved contact
  -> discovery
  -> written pilot proposal
  -> acceptance
  -> client/workspace creation
  -> limited onboarding
  -> pilot execution
  -> measured review
  -> private feedback
  -> optional portfolio consent
  -> optional paid continuation
```

No enviar invitación al Client Portal al registrar un candidato. La invitación solo
procede después de aceptación escrita y creación controlada del workspace.

## 8. Qué medir sin inventar

Definir una línea base antes del piloto y medir únicamente datos observables:

- tiempo manual dedicado al proceso seleccionado;
- número de solicitudes recibidas por el canal implementado;
- tiempo de primera respuesta;
- tareas completadas o bloqueadas;
- errores, duplicados o citas fallidas;
- uso real del prototipo;
- feedback cualitativo del negocio.

No publicar porcentajes, ingresos, conversiones o ahorros sin muestra, periodo,
fuente y autorización del negocio.

## 9. Criterios para elegir los primeros 3-5 pilotos

Un candidato es adecuado cuando:

- tiene un problema concreto que cabe en un piloto;
- existe una persona responsable disponible;
- acepta usar datos ficticios o minimizados inicialmente;
- puede revisar entregas en plazos acordados;
- no exige integraciones críticas o datos sensibles como primer experimento;
- comprende costes futuros y límites del piloto;
- encaja en uno de los cuatro patrones sectoriales.

Evitar como primer piloto:

- migraciones masivas;
- pagos reales;
- expedientes clínicos;
- automatizaciones irreversibles;
- sistemas críticos de disponibilidad;
- múltiples ubicaciones y permisos complejos;
- promesas de SEO o ventas en un plazo fijo.

## 10. Próxima acción comercial

1. Validar las cuatro fichas demo y el alcance de piloto de cada una.
2. Añadir en Altaira CRM los estados y campos de cumplimiento antes de registrar
   candidatos reales.
3. Preparar un formulario de interés y una hoja breve de condiciones del piloto.
4. Crear manualmente una lista pequeña desde referencias, asociaciones y eventos.
5. Revisar cumplimiento por país y canal antes del primer contacto.
6. Ejecutar un solo piloto, medirlo y corregir el proceso antes de ampliar a cinco.
