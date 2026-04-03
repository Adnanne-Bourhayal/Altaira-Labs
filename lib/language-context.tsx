"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type LanguageCode = "en" | "es" | "nl" | "fr" | "de"

interface Translations {
  // Header
  nav: {
    businesses: string
    examples: string
    pricing: string
    contact: string
    getProposal: string
  }
  // Hero
  hero: {
    badge: string
    title1: string
    title2: string
    subtitle: string
    cta: string
    viewExamples: string
  }
  // Business Types
  businesses: {
    title: string
    subtitle: string
    seeExample: string
    carDealers: string
    carDealersDesc: string
    hairSalons: string
    hairSalonsDesc: string
    bikeShops: string
    bikeShopsDesc: string
    restaurants: string
    restaurantsDesc: string
    clinics: string
    clinicsDesc: string
  }
  // Pricing
  pricing: {
    title: string
    subtitle: string
    from: string
    currency: string
    getStarted: string
    mostPopular: string
    bestValue: string
    vatNote: string
    // Plans
    starter: string
    starterDesc: string
    growth: string
    growthDesc: string
    pro: string
    proDesc: string
    // Features
    onePage: string
    responsive: string
    contactForm: string
    fastDelivery: string
    multiPage: string
    whatsapp: string
    basicSeo: string
    analytics: string
    revisions: string
    advanced: string
    booking: string
    emailAuto: string
    dashboard: string
    prioritySupport: string
  }
  // Contact
  contact: {
    title: string
    subtitle: string
    name: string
    namePlaceholder: string
    business: string
    businessPlaceholder: string
    email: string
    emailPlaceholder: string
    send: string
    sending: string
    sent: string
    sentMessage: string
    whatsapp: string
    whatsappDesc: string
    schedule: string
    scheduleDesc: string
    whatYouGet: string
    analysis: string
    customDesign: string
    detailedQuote: string
    estimatedDelivery: string
  }
  // Insights
  insights: {
    title: string
    subtitle: string
    readMore: string
    minRead: string
  }
  // Footer
  footer: {
    rights: string
  }
}

const translations: Record<LanguageCode, Translations> = {
  en: {
    nav: {
      businesses: "Businesses",
      examples: "Examples",
      pricing: "Pricing",
      contact: "Contact",
      getProposal: "Get Free Proposal",
    },
    hero: {
      badge: "Websites, booking systems & automation",
      title1: "More clients.",
      title2: "Less manual work.",
      subtitle: "We build websites and smart automation systems that help your business grow 24/7 and generate leads on autopilot.",
      cta: "Get Free Proposal",
      viewExamples: "View Examples",
    },
    businesses: {
      title: "Built for your business",
      subtitle: "Tailored solutions for every industry",
      seeExample: "See Example",
      carDealers: "Car Dealers",
      carDealersDesc: "Showcase inventory and capture leads",
      hairSalons: "Hair Salons",
      hairSalonsDesc: "Online booking and reminders",
      bikeShops: "Bike Shops",
      bikeShopsDesc: "Catalog and service scheduling",
      restaurants: "Restaurants",
      restaurantsDesc: "Menu and table reservations",
      clinics: "Clinics",
      clinicsDesc: "Patient booking system",
    },
    pricing: {
      title: "Simple pricing",
      subtitle: "No hidden fees. One-time payment.",
      from: "from",
      currency: "EUR",
      getStarted: "Get Started",
      mostPopular: "Most Popular",
      bestValue: "Best Value",
      vatNote: "All prices include VAT. One-time payment, no subscriptions.",
      starter: "Starter",
      starterDesc: "Perfect to start your online presence",
      growth: "Growth",
      growthDesc: "For businesses ready to scale",
      pro: "Pro",
      proDesc: "Full automation system",
      onePage: "One-page website",
      responsive: "Responsive design",
      contactForm: "Contact form",
      fastDelivery: "Fast delivery",
      multiPage: "Multi-page website",
      whatsapp: "WhatsApp integration",
      basicSeo: "Basic SEO",
      analytics: "Google Analytics",
      revisions: "3 revisions",
      advanced: "Advanced website",
      booking: "Booking system",
      emailAuto: "Email automation",
      dashboard: "Dashboard",
      prioritySupport: "Priority support",
    },
    contact: {
      title: "Get your free proposal",
      subtitle: "Response within 24 hours",
      name: "Name",
      namePlaceholder: "Your name",
      business: "Business",
      businessPlaceholder: "Your business name",
      email: "Email",
      emailPlaceholder: "you@email.com",
      send: "Get Free Proposal",
      sending: "Sending...",
      sent: "Sent",
      sentMessage: "We will contact you within 24 hours.",
      whatsapp: "WhatsApp",
      whatsappDesc: "Quick response",
      schedule: "Schedule a Call",
      scheduleDesc: "15 min free consultation",
      whatYouGet: "What you get:",
      analysis: "Analysis of your situation",
      customDesign: "Custom design proposal",
      detailedQuote: "Detailed quote",
      estimatedDelivery: "Estimated delivery",
    },
    insights: {
      title: "Insights",
      subtitle: "Learn how to grow your business online",
      readMore: "Read more",
      minRead: "min read",
    },
    footer: {
      rights: "All rights reserved.",
    },
  },
  es: {
    nav: {
      businesses: "Negocios",
      examples: "Ejemplos",
      pricing: "Precios",
      contact: "Contacto",
      getProposal: "Propuesta Gratis",
    },
    hero: {
      badge: "Webs, reservas y automatizacion",
      title1: "Mas clientes.",
      title2: "Menos trabajo manual.",
      subtitle: "Creamos webs y sistemas de automatizacion que ayudan a tu negocio a crecer 24/7 y generar leads en piloto automatico.",
      cta: "Propuesta Gratis",
      viewExamples: "Ver Ejemplos",
    },
    businesses: {
      title: "Hecho para tu negocio",
      subtitle: "Soluciones adaptadas a cada industria",
      seeExample: "Ver Ejemplo",
      carDealers: "Concesionarios",
      carDealersDesc: "Muestra inventario y capta leads",
      hairSalons: "Peluquerias",
      hairSalonsDesc: "Reservas online y recordatorios",
      bikeShops: "Tiendas de Bici",
      bikeShopsDesc: "Catalogo y citas de servicio",
      restaurants: "Restaurantes",
      restaurantsDesc: "Menu y reserva de mesas",
      clinics: "Clinicas",
      clinicsDesc: "Sistema de citas para pacientes",
    },
    pricing: {
      title: "Precios simples",
      subtitle: "Sin costes ocultos. Pago unico.",
      from: "desde",
      currency: "EUR",
      getStarted: "Empezar",
      mostPopular: "Mas Popular",
      bestValue: "Mejor Valor",
      vatNote: "Todos los precios incluyen IVA. Pago unico, sin suscripciones.",
      starter: "Inicial",
      starterDesc: "Perfecto para empezar tu presencia online",
      growth: "Crecimiento",
      growthDesc: "Para negocios listos para escalar",
      pro: "Pro",
      proDesc: "Sistema de automatizacion completo",
      onePage: "Web de una pagina",
      responsive: "Diseno responsive",
      contactForm: "Formulario de contacto",
      fastDelivery: "Entrega rapida",
      multiPage: "Web multipagina",
      whatsapp: "Integracion WhatsApp",
      basicSeo: "SEO basico",
      analytics: "Google Analytics",
      revisions: "3 revisiones",
      advanced: "Web avanzada",
      booking: "Sistema de reservas",
      emailAuto: "Automatizacion de emails",
      dashboard: "Panel de control",
      prioritySupport: "Soporte prioritario",
    },
    contact: {
      title: "Recibe tu propuesta gratis",
      subtitle: "Respuesta en 24 horas",
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      business: "Negocio",
      businessPlaceholder: "Nombre de tu negocio",
      email: "Email",
      emailPlaceholder: "tu@email.com",
      send: "Recibir Propuesta",
      sending: "Enviando...",
      sent: "Enviado",
      sentMessage: "Te contactaremos en 24 horas.",
      whatsapp: "WhatsApp",
      whatsappDesc: "Respuesta rapida",
      schedule: "Agendar Llamada",
      scheduleDesc: "15 min consulta gratis",
      whatYouGet: "Lo que recibes:",
      analysis: "Analisis de tu situacion",
      customDesign: "Propuesta de diseno personalizada",
      detailedQuote: "Presupuesto detallado",
      estimatedDelivery: "Tiempo de entrega estimado",
    },
    insights: {
      title: "Insights",
      subtitle: "Aprende a hacer crecer tu negocio online",
      readMore: "Leer mas",
      minRead: "min de lectura",
    },
    footer: {
      rights: "Todos los derechos reservados.",
    },
  },
  nl: {
    nav: {
      businesses: "Bedrijven",
      examples: "Voorbeelden",
      pricing: "Prijzen",
      contact: "Contact",
      getProposal: "Gratis Voorstel",
    },
    hero: {
      badge: "Websites, boekingssystemen en automatisering",
      title1: "Meer klanten.",
      title2: "Minder handwerk.",
      subtitle: "Wij bouwen websites en slimme automatiseringssystemen die je bedrijf 24/7 helpen groeien en leads genereren op de automatische piloot.",
      cta: "Gratis Voorstel",
      viewExamples: "Bekijk Voorbeelden",
    },
    businesses: {
      title: "Gemaakt voor jouw bedrijf",
      subtitle: "Oplossingen op maat voor elke branche",
      seeExample: "Bekijk Voorbeeld",
      carDealers: "Autodealers",
      carDealersDesc: "Toon inventaris en genereer leads",
      hairSalons: "Kappers",
      hairSalonsDesc: "Online boeken en herinneringen",
      bikeShops: "Fietswinkels",
      bikeShopsDesc: "Catalogus en service planning",
      restaurants: "Restaurants",
      restaurantsDesc: "Menu en tafelreserveringen",
      clinics: "Klinieken",
      clinicsDesc: "Afspraaksysteem voor patienten",
    },
    pricing: {
      title: "Eenvoudige prijzen",
      subtitle: "Geen verborgen kosten. Eenmalige betaling.",
      from: "vanaf",
      currency: "EUR",
      getStarted: "Aan de slag",
      mostPopular: "Meest Populair",
      bestValue: "Beste Waarde",
      vatNote: "Alle prijzen zijn inclusief BTW. Eenmalige betaling, geen abonnementen.",
      starter: "Starter",
      starterDesc: "Perfect om online te beginnen",
      growth: "Groei",
      growthDesc: "Voor bedrijven klaar om te schalen",
      pro: "Pro",
      proDesc: "Volledig automatiseringssysteem",
      onePage: "Een-pagina website",
      responsive: "Responsive design",
      contactForm: "Contactformulier",
      fastDelivery: "Snelle levering",
      multiPage: "Meerdere paginas",
      whatsapp: "WhatsApp integratie",
      basicSeo: "Basis SEO",
      analytics: "Google Analytics",
      revisions: "3 revisies",
      advanced: "Geavanceerde website",
      booking: "Boekingssysteem",
      emailAuto: "E-mail automatisering",
      dashboard: "Dashboard",
      prioritySupport: "Prioriteit support",
    },
    contact: {
      title: "Ontvang je gratis voorstel",
      subtitle: "Reactie binnen 24 uur",
      name: "Naam",
      namePlaceholder: "Je naam",
      business: "Bedrijf",
      businessPlaceholder: "Je bedrijfsnaam",
      email: "E-mail",
      emailPlaceholder: "jij@email.com",
      send: "Voorstel Ontvangen",
      sending: "Verzenden...",
      sent: "Verzonden",
      sentMessage: "We nemen binnen 24 uur contact op.",
      whatsapp: "WhatsApp",
      whatsappDesc: "Snelle reactie",
      schedule: "Plan een Gesprek",
      scheduleDesc: "15 min gratis consult",
      whatYouGet: "Wat je krijgt:",
      analysis: "Analyse van je situatie",
      customDesign: "Op maat gemaakt ontwerp voorstel",
      detailedQuote: "Gedetailleerde offerte",
      estimatedDelivery: "Geschatte levertijd",
    },
    insights: {
      title: "Insights",
      subtitle: "Leer hoe je je bedrijf online laat groeien",
      readMore: "Lees meer",
      minRead: "min lezen",
    },
    footer: {
      rights: "Alle rechten voorbehouden.",
    },
  },
  fr: {
    nav: {
      businesses: "Entreprises",
      examples: "Exemples",
      pricing: "Tarifs",
      contact: "Contact",
      getProposal: "Devis Gratuit",
    },
    hero: {
      badge: "Sites web, reservations et automatisation",
      title1: "Plus de clients.",
      title2: "Moins de travail manuel.",
      subtitle: "Nous creons des sites web et des systemes d'automatisation intelligents qui aident votre entreprise a croitre 24/7 et a generer des leads en pilote automatique.",
      cta: "Devis Gratuit",
      viewExamples: "Voir Exemples",
    },
    businesses: {
      title: "Concu pour votre entreprise",
      subtitle: "Solutions adaptees a chaque secteur",
      seeExample: "Voir Exemple",
      carDealers: "Concessionnaires",
      carDealersDesc: "Presentez l'inventaire et captez des leads",
      hairSalons: "Salons de Coiffure",
      hairSalonsDesc: "Reservations en ligne et rappels",
      bikeShops: "Magasins de Velo",
      bikeShopsDesc: "Catalogue et planification de service",
      restaurants: "Restaurants",
      restaurantsDesc: "Menu et reservations de tables",
      clinics: "Cliniques",
      clinicsDesc: "Systeme de rendez-vous patients",
    },
    pricing: {
      title: "Tarifs simples",
      subtitle: "Pas de frais caches. Paiement unique.",
      from: "a partir de",
      currency: "EUR",
      getStarted: "Commencer",
      mostPopular: "Le Plus Populaire",
      bestValue: "Meilleur Rapport",
      vatNote: "Tous les prix incluent la TVA. Paiement unique, sans abonnement.",
      starter: "Starter",
      starterDesc: "Parfait pour demarrer votre presence en ligne",
      growth: "Croissance",
      growthDesc: "Pour les entreprises pretes a grandir",
      pro: "Pro",
      proDesc: "Systeme d'automatisation complet",
      onePage: "Site une page",
      responsive: "Design responsive",
      contactForm: "Formulaire de contact",
      fastDelivery: "Livraison rapide",
      multiPage: "Site multi-pages",
      whatsapp: "Integration WhatsApp",
      basicSeo: "SEO de base",
      analytics: "Google Analytics",
      revisions: "3 revisions",
      advanced: "Site avance",
      booking: "Systeme de reservation",
      emailAuto: "Automatisation email",
      dashboard: "Tableau de bord",
      prioritySupport: "Support prioritaire",
    },
    contact: {
      title: "Recevez votre devis gratuit",
      subtitle: "Reponse sous 24 heures",
      name: "Nom",
      namePlaceholder: "Votre nom",
      business: "Entreprise",
      businessPlaceholder: "Nom de votre entreprise",
      email: "Email",
      emailPlaceholder: "vous@email.com",
      send: "Recevoir le Devis",
      sending: "Envoi en cours...",
      sent: "Envoye",
      sentMessage: "Nous vous contacterons sous 24 heures.",
      whatsapp: "WhatsApp",
      whatsappDesc: "Reponse rapide",
      schedule: "Planifier un Appel",
      scheduleDesc: "15 min consultation gratuite",
      whatYouGet: "Ce que vous obtenez:",
      analysis: "Analyse de votre situation",
      customDesign: "Proposition de design personnalisee",
      detailedQuote: "Devis detaille",
      estimatedDelivery: "Delai de livraison estime",
    },
    insights: {
      title: "Insights",
      subtitle: "Apprenez a developper votre entreprise en ligne",
      readMore: "Lire plus",
      minRead: "min de lecture",
    },
    footer: {
      rights: "Tous droits reserves.",
    },
  },
  de: {
    nav: {
      businesses: "Unternehmen",
      examples: "Beispiele",
      pricing: "Preise",
      contact: "Kontakt",
      getProposal: "Kostenloses Angebot",
    },
    hero: {
      badge: "Websites, Buchungssysteme und Automatisierung",
      title1: "Mehr Kunden.",
      title2: "Weniger manuelle Arbeit.",
      subtitle: "Wir erstellen Websites und intelligente Automatisierungssysteme, die Ihrem Unternehmen helfen, rund um die Uhr zu wachsen und Leads auf Autopilot zu generieren.",
      cta: "Kostenloses Angebot",
      viewExamples: "Beispiele ansehen",
    },
    businesses: {
      title: "Fur Ihr Unternehmen gebaut",
      subtitle: "Massgeschneiderte Losungen fur jede Branche",
      seeExample: "Beispiel ansehen",
      carDealers: "Autohandler",
      carDealersDesc: "Inventar prasentieren und Leads generieren",
      hairSalons: "Friseursalons",
      hairSalonsDesc: "Online-Buchung und Erinnerungen",
      bikeShops: "Fahrradladen",
      bikeShopsDesc: "Katalog und Service-Terminierung",
      restaurants: "Restaurants",
      restaurantsDesc: "Menu und Tischreservierungen",
      clinics: "Kliniken",
      clinicsDesc: "Patienten-Terminbuchung",
    },
    pricing: {
      title: "Einfache Preise",
      subtitle: "Keine versteckten Kosten. Einmalzahlung.",
      from: "ab",
      currency: "EUR",
      getStarted: "Loslegen",
      mostPopular: "Am Beliebtesten",
      bestValue: "Bestes Preis-Leistungs",
      vatNote: "Alle Preise inkl. MwSt. Einmalzahlung, keine Abonnements.",
      starter: "Starter",
      starterDesc: "Perfekt fur den Online-Start",
      growth: "Wachstum",
      growthDesc: "Fur Unternehmen bereit zu skalieren",
      pro: "Pro",
      proDesc: "Vollstandiges Automatisierungssystem",
      onePage: "Eine-Seite Website",
      responsive: "Responsive Design",
      contactForm: "Kontaktformular",
      fastDelivery: "Schnelle Lieferung",
      multiPage: "Mehrseitige Website",
      whatsapp: "WhatsApp-Integration",
      basicSeo: "Basis SEO",
      analytics: "Google Analytics",
      revisions: "3 Revisionen",
      advanced: "Fortgeschrittene Website",
      booking: "Buchungssystem",
      emailAuto: "E-Mail-Automatisierung",
      dashboard: "Dashboard",
      prioritySupport: "Prioritats-Support",
    },
    contact: {
      title: "Erhalten Sie Ihr kostenloses Angebot",
      subtitle: "Antwort innerhalb von 24 Stunden",
      name: "Name",
      namePlaceholder: "Ihr Name",
      business: "Unternehmen",
      businessPlaceholder: "Ihr Unternehmensname",
      email: "E-Mail",
      emailPlaceholder: "sie@email.com",
      send: "Angebot Erhalten",
      sending: "Wird gesendet...",
      sent: "Gesendet",
      sentMessage: "Wir melden uns innerhalb von 24 Stunden.",
      whatsapp: "WhatsApp",
      whatsappDesc: "Schnelle Antwort",
      schedule: "Gesprach Vereinbaren",
      scheduleDesc: "15 Min kostenlose Beratung",
      whatYouGet: "Was Sie erhalten:",
      analysis: "Analyse Ihrer Situation",
      customDesign: "Individueller Designvorschlag",
      detailedQuote: "Detailliertes Angebot",
      estimatedDelivery: "Geschatzte Lieferzeit",
    },
    insights: {
      title: "Insights",
      subtitle: "Lernen Sie, wie Sie Ihr Unternehmen online wachsen lassen",
      readMore: "Mehr lesen",
      minRead: "Min. Lesezeit",
    },
    footer: {
      rights: "Alle Rechte vorbehalten.",
    },
  },
}

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en")

  const value = {
    language,
    setLanguage,
    t: translations[language],
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export const languageOptions = [
  { code: "en" as const, label: "English" },
  { code: "nl" as const, label: "Nederlands" },
  { code: "es" as const, label: "Espanol" },
  { code: "fr" as const, label: "Francais" },
  { code: "de" as const, label: "Deutsch" },
]
