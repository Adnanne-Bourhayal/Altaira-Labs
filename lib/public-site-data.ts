export type PublicService = {
  slug: string
  title: string
  navLabel: string
  category: string
  summary: string
  valueProposition: string
  detailIntro: string
  imageLabel: string
  imageSrc: string
  imageAlt: string
  benefits: string[]
  deliverables: string[]
  contactMessage: string
}

export type EvidenceSignal = {
  value: string
  label: string
  source: string
  sourceUrl?: string
}

export type BusinessSector = {
  slug: string
  title: string
  summary: string
  painPoints: string[]
  recommendedServices: string[]
  primaryService: string
  technologyContext: string[]
  manualSnapshot: string[]
  digitalSnapshot: string[]
  evidenceSignals: EvidenceSignal[]
  caseTitle: string
  caseText: string
  imageSrc: string
  imageAlt: string
}

export type BlogPost = {
  slug: string
  title: string
  category: string
  excerpt: string
  readTime: string
  imageSrc: string
  imageAlt: string
}

export const publicServices: PublicService[] = [
  {
    slug: "professional-website",
    title: "Professional Websites",
    navLabel: "Professional Websites",
    category: "Digital presence",
    summary: "Clear websites for local businesses that need trust, service pages and qualified requests.",
    valueProposition:
      "A serious website should explain the offer, build trust and route useful requests into the business workflow.",
    detailIntro:
      "A professional website works like a controlled front desk: it explains the offer, guides the visitor and sends useful lead data into the workspace instead of leaving the business to chase scattered messages.",
    imageLabel: "Website and SEO",
    imageSrc: "/site-images/service-professional-websites-seo.jpg",
    imageAlt: "Keyboard with SEO text representing a professional website and discoverability",
    benefits: ["Clear offer presentation", "Lead form connected to the system", "Fast responsive layout", "Local SEO-ready content structure"],
    deliverables: ["Landing and service pages", "Contact and lead form", "Basic local SEO structure", "Admin-readable lead data"],
    contactMessage: "Hi Altaira Labs, I want to discuss a professional website for my local business.",
  },
  {
    slug: "booking-system",
    title: "Booking Systems",
    navLabel: "Booking Systems",
    category: "Operations",
    summary: "Booking flows for appointments, reservations and enquiries that still need human review.",
    valueProposition:
      "Collect the right request data before confirmation and keep each appointment or reservation traceable.",
    detailIntro:
      "A booking system captures date, time, client details and context before the team confirms, so clinics, restaurants and service businesses reduce repeated messages without losing human control.",
    imageLabel: "Booking flow",
    imageSrc: "/site-images/service-booking-systems-reservations.jpg",
    imageAlt: "Restaurant table prepared for reservation workflows",
    benefits: ["Cleaner appointment requests", "Less repeated messaging", "Better confirmation process", "Useful data for follow-up"],
    deliverables: ["Booking request form", "Admin review flow", "Status tracking", "Client communication handoff"],
    contactMessage: "Hi Altaira Labs, I want to discuss a booking system for my business.",
  },
  {
    slug: "management-dashboard",
    title: "Management Dashboard",
    navLabel: "Management Dashboard",
    category: "Internal systems",
    summary: "Private dashboards that help small teams manage leads, clients, services, notes and status.",
    valueProposition:
      "Give the team one place to see what arrived, who owns it and what should happen next.",
    detailIntro:
      "A management dashboard turns daily work into one operational view: leads, clients, assigned services, internal notes and status changes without forcing the team to jump between WhatsApp, Excel and disconnected inboxes.",
    imageLabel: "Operational dashboard",
    imageSrc: "/site-images/service-management-dashboard-analytics.jpg",
    imageAlt: "Analytics dashboard on a laptop representing operational visibility",
    benefits: ["Lead and client visibility", "Service assignment", "Internal notes", "Status-based execution"],
    deliverables: ["Admin dashboard", "Client records", "Service assignment view", "Internal note sections"],
    contactMessage: "Hi Altaira Labs, I want to discuss a management dashboard for my business.",
  },
  {
    slug: "automations",
    title: "Workflow Automation",
    navLabel: "Workflow Automation",
    category: "Workflow",
    summary: "Small, controlled automations for repetitive admin steps, reminders and handoffs.",
    valueProposition:
      "Automate repetitive workflow steps while keeping human control where the business still needs review.",
    detailIntro:
      "Useful automation starts with one repeated step. The goal is to reduce manual admin, improve handoffs and keep the owner in control of important decisions.",
    imageLabel: "Automation map",
    imageSrc: "/site-images/service-workflow-automation-board.jpg",
    imageAlt: "Startup workflow board used to map digital processes",
    benefits: ["Reduced repetitive work", "Cleaner handoffs", "Fewer forgotten steps", "Predictable status changes"],
    deliverables: ["Workflow mapping", "Automation rules", "Notification handoff", "Admin-safe execution logic"],
    contactMessage: "Hi Altaira Labs, I want to discuss workflow automation for my business.",
  },
  {
    slug: "crm-system",
    title: "CRM / Lead Management Systems",
    navLabel: "CRM / Lead Management",
    category: "Client management",
    summary: "Lightweight CRM and lead management systems for businesses that need clear follow-up.",
    valueProposition:
      "Move from scattered notes and forgotten messages into a simple client system that supports daily operation.",
    detailIntro:
      "A lightweight CRM keeps the client record, requested service, previous context and next action in one place, so follow-up depends on a visible process instead of memory.",
    imageLabel: "Client workspace",
    imageSrc: "/site-images/service-crm-lead-management-workspace.jpg",
    imageAlt: "Reception desk representing structured client and lead management",
    benefits: ["Client records", "Service history", "Follow-up notes", "Operational visibility"],
    deliverables: ["Client list and detail", "Service relations", "Internal notes", "Lead-to-client workflow"],
    contactMessage: "Hi Altaira Labs, I want to discuss CRM or lead management for my business.",
  },
]

export const businessSectors: BusinessSector[] = [
  {
    slug: "clinics",
    title: "Clinics",
    summary: "Dental, aesthetic, physiotherapy and psychology clinics with intake, appointments and follow-up in one controlled workflow.",
    painPoints: ["Manual appointment requests", "Lost patient follow-up context", "Repeated intake questions"],
    recommendedServices: ["booking-system", "crm-system", "management-dashboard"],
    primaryService: "CRM and booking workflow",
    technologyContext: [
      "Clinics depend on trust, clarity and follow-up. Digital tools should help the team receive appointment requests, collect basic intake information and avoid repeating the same questions across phone calls and messages.",
      "For dental clinics, aesthetic clinics, physiotherapy practices and psychology practices, the useful stack is practical: booking requests, intake forms, patient or client CRM, internal notes, reminders and a simple dashboard for daily visibility.",
      "Altaira Labs keeps this controlled and explainable: the system supports the clinic team, but sensitive decisions and confirmations stay human-led.",
    ],
    manualSnapshot: ["Phone-first appointment requests", "Repeated intake questions", "Follow-up notes split across tools"],
    digitalSnapshot: ["Online request and intake flow", "Reminder and status trail", "Patient context visible before follow-up"],
    evidenceSignals: [
      {
        value: "80%",
        label: "of healthcare consumers say online scheduling influences provider choice.",
        source: "Press Ganey",
        sourceUrl: "https://info.pressganey.com/e-books-research/2025-consumer-experience-trends-in-healthcare/",
      },
      {
        value: "89%",
        label: "say accurate online provider information influences their choice.",
        source: "Press Ganey",
        sourceUrl: "https://info.pressganey.com/e-books-research/2025-consumer-experience-trends-in-healthcare/",
      },
      {
        value: "+11%",
        label: "relative attendance improvement reported in an appointment-reminder meta-analysis.",
        source: "JHMHP",
        sourceUrl: "https://jhmhp.amegroups.org/article/view/6250/html",
      },
    ],
    caseTitle: "Clinic operations need trust before speed.",
    caseText:
      "A small clinic can use a lightweight CRM, booking request flow and intake form to collect patient context, reduce repeated questions and keep appointment follow-up visible for the team.",
    imageSrc: "/site-images/sector-clinics-patient-scheduling.jpg",
    imageAlt: "Doctor working beside a computer in a clinic setting",
  },
  {
    slug: "car-dealers",
    title: "Car Dealers",
    summary: "Vehicle interest, lead qualification and sales follow-up without losing context.",
    painPoints: ["Unqualified car enquiries", "Slow follow-up", "No clear pipeline visibility"],
    recommendedServices: ["professional-website", "crm-system", "automations"],
    primaryService: "Website and lead CRM",
    technologyContext: [
      "Car dealers need their website to behave like a clean digital showroom. Vehicle photos, availability, finance questions, trade-in context and test-drive requests should become a structured sales conversation.",
      "The most useful tools are a vehicle-focused website, structured lead capture, CRM follow-up and small automations for reminders or handoffs.",
      "The goal is faster response with better information, not an oversized enterprise system.",
    ],
    manualSnapshot: ["Vehicle enquiries hidden in chats", "No clean view of active buyers", "Photos and vehicle context handled inconsistently"],
    digitalSnapshot: ["Inventory-style pages with clear CTA", "Lead CRM for availability, budget and trade-in context", "Visible pipeline for follow-up and test-drive requests"],
    evidenceSignals: [
      {
        value: "50%+",
        label: "of the buying journey is completed online by mostly digital car buyers.",
        source: "Cox Automotive",
        sourceUrl: "https://www.coxautoinc.com/wp-content/uploads/2025/01/2024-Car-Buyer-Journey-Study-Overview.pdf",
      },
      {
        value: "75%",
        label: "new-car buyer satisfaction reported in the 2024 Car Buyer Journey study.",
        source: "Cox Automotive",
        sourceUrl: "https://www.coxautoinc.com/news/2024-car-buyer-journey-study/",
      },
      {
        value: "81%",
        label: "dealership satisfaction reported as a historic high in the same study.",
        source: "Cox Automotive",
        sourceUrl: "https://www.coxautoinc.com/news/2024-car-buyer-journey-study/",
      },
    ],
    caseTitle: "A vehicle enquiry should not disappear into a chat inbox.",
    caseText:
      "A professional website connected to a CRM helps dealers capture the vehicle, budget and contact context before the sales follow-up starts.",
    imageSrc: "/site-images/sector-car-dealers-showroom-handoff.jpg",
    imageAlt: "Car dealer handing keys to potential clients",
  },
  {
    slug: "restaurants",
    title: "Restaurants",
    summary: "Reservation requests, private enquiries and customer communication with less manual chasing.",
    painPoints: ["Reservation back-and-forth", "Private event requests", "Disconnected customer messages"],
    recommendedServices: ["booking-system", "professional-website", "automations"],
    primaryService: "Booking system",
    technologyContext: [
      "Restaurants need predictable flow: reservations, private event enquiries, table planning and customer communication all compete for time during service hours.",
      "A booking request system helps collect date, time, party size and special context before the team confirms. It can also make private requests easier to track.",
      "For a local restaurant, the technology should reduce back-and-forth and support repeat contact without making the booking process feel cold.",
    ],
    manualSnapshot: ["Calls and messages arrive during service", "Party size, time and special requests get repeated", "No simple view of peak demand or no-shows"],
    digitalSnapshot: ["Reservation request flow before confirmation", "Table and private enquiry context in one process", "KPIs such as covers, wait time and no-shows become visible"],
    evidenceSignals: [
      {
        value: "Covers",
        label: "reservation systems can track cover trends, reservation sources and guest patterns.",
        source: "OpenTable",
        sourceUrl: "https://restaurant.opentable.com/solutions/",
      },
      {
        value: "Turn time",
        label: "table management systems help optimize seating, turn times and empty table time.",
        source: "OpenTable",
        sourceUrl: "https://restaurant.opentable.com/resources/restaurant-table-management-system/",
      },
      {
        value: "KPIs",
        label: "useful metrics include wait time, peak-hour covers, return rate and revenue per seat.",
        source: "OpenTable",
        sourceUrl: "https://restaurant.opentable.com/resources/restaurant-table-management-system/",
      },
    ],
    caseTitle: "Restaurants benefit when booking demand becomes structured.",
    caseText:
      "A booking system gives the team a consistent way to receive reservations, review availability and maintain a steady client flow over time.",
    imageSrc: "/site-images/sector-restaurants-booking-flow.jpg",
    imageAlt: "Restaurant table prepared for a structured booking flow",
  },
  {
    slug: "specialty-by-sector",
    title: "Specialty by Sector",
    summary: "Custom workflows adapted to the business model, daily operation and client journey.",
    painPoints: ["Specific operational rules", "Mixed manual tools", "Processes that do not fit generic software"],
    recommendedServices: ["management-dashboard", "automations", "crm-system"],
    primaryService: "Custom workflow system",
    technologyContext: [
      "Some local businesses do not fit generic software. Their value is in the specific way they receive clients, validate requests, deliver work and keep operational context.",
      "A specialty workflow starts by mapping the real journey: request, review, client record, service assignment, internal notes and next action.",
      "The right system is usually smaller than a full platform but more useful than a generic form or spreadsheet.",
    ],
    manualSnapshot: ["Specific rules forced into generic tools", "Manual checks repeated by the owner", "No single view of client journey"],
    digitalSnapshot: ["Workflow mapped around the real operation", "Clear handoffs and status changes", "Team can understand the system without heavy software training"],
    evidenceSignals: [
      { value: "Map", label: "Current process translated into clear software steps.", source: "Altaira workflow model" },
      { value: "Reduce", label: "Manual repetition removed only where it makes sense.", source: "Altaira workflow model" },
      { value: "Train", label: "The system stays small enough for the team to use daily.", source: "Altaira workflow model" },
    ],
    caseTitle: "Some businesses need software that follows their real operation.",
    caseText:
      "Specialty workflows work best when the system is built around how the business receives clients, makes decisions and delivers the service.",
    imageSrc: "/site-images/sector-specialty-workflow-mapping.jpg",
    imageAlt: "Business workflow mapping session for a custom operational system",
  },
]

export const blogPosts: BlogPost[] = [
  {
    slug: "manual-work-cost",
    title: "The real cost of manual admin work in small businesses",
    category: "Operations",
    excerpt: "How repeated WhatsApp messages, Excel files, calls and delayed follow-up create operational cost.",
    readTime: "4 min",
    imageSrc: "/site-images/blog-manual-admin-work.jpg",
    imageAlt: "Notebook and laptop used for manual admin work",
  },
  {
    slug: "lead-flow-before-crm",
    title: "Why a clean lead flow should come before a complex CRM",
    category: "Lead management",
    excerpt: "A practical sequence for moving from public request to client record without overbuilding.",
    readTime: "5 min",
    imageSrc: "/site-images/blog-lead-flow-before-crm.jpg",
    imageAlt: "Team discussing a structured business process before CRM implementation",
  },
  {
    slug: "booking-systems-local-business",
    title: "What a booking system should do for local operations",
    category: "Booking",
    excerpt: "The useful parts of booking software: requests, review, confirmation, reminders and follow-up context.",
    readTime: "3 min",
    imageSrc: "/site-images/blog-booking-systems-local-restaurant.jpg",
    imageAlt: "Restaurant table setting representing organised booking operations",
  },
]

export function getServiceBySlug(slug: string) {
  return publicServices.find((service) => service.slug === slug)
}

export function getSectorBySlug(slug: string) {
  return businessSectors.find((sector) => sector.slug === slug)
}

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
