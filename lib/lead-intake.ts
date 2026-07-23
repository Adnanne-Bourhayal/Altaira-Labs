export type LeadFormKey = "general" | "web_seo" | "booking" | "crm" | "automation" | "dashboard"

export type LeadQuestion = {
  key: string
  label: string
  help?: string
  type: "select" | "text" | "textarea" | "number"
  required?: boolean
  options?: Array<{ value: string; label: string }>
  section?: "requirements" | "discovery" | "commercial" | "internal"
  min?: number
  max?: number
  visibleWhen?: {
    key: string
    values: string[]
  }
}

export type LeadFormDefinition = {
  key: LeadFormKey
  title: string
  shortTitle: string
  summary: string
  questions: LeadQuestion[]
}

const yesNoUnknown = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Not decided yet" },
]

export const LEAD_FORM_DEFINITIONS: LeadFormDefinition[] = [
  {
    key: "general",
    title: "General business diagnostic",
    shortTitle: "General diagnostic",
    summary: "Use when the business is not yet sure which system should come first.",
    questions: [
      {
        key: "primaryGoal",
        label: "What should improve first?",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a priority" },
          { value: "online_presence", label: "Online presence and enquiries" },
          { value: "bookings", label: "Bookings or appointments" },
          { value: "lead_management", label: "Lead and client follow-up" },
          { value: "automation", label: "Repetitive administrative work" },
          { value: "visibility", label: "Operational visibility and reporting" },
        ],
      },
      {
        key: "onlinePresence",
        label: "Current online presence",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select current state" },
          { value: "none", label: "No website" },
          { value: "basic", label: "Basic page with limited enquiries" },
          { value: "outdated", label: "Website exists but needs rebuilding" },
          { value: "working", label: "Website already supports the business" },
        ],
      },
      {
        key: "bookingProcess",
        label: "How are bookings handled?",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a process" },
          { value: "not_applicable", label: "Bookings are not relevant" },
          { value: "calls_messages", label: "Calls, email or messages" },
          { value: "spreadsheet_calendar", label: "Spreadsheet or shared calendar" },
          { value: "booking_tool", label: "A booking tool is already in use" },
        ],
      },
      {
        key: "leadProcess",
        label: "How are enquiries followed up?",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a process" },
          { value: "messages_email", label: "Messages and email inboxes" },
          { value: "spreadsheet", label: "Spreadsheet" },
          { value: "crm", label: "CRM or structured workspace" },
        ],
      },
      {
        key: "repetitiveWork",
        label: "Amount of repetitive weekly admin",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select an estimate" },
          { value: "low", label: "Low" },
          { value: "medium", label: "Material but manageable" },
          { value: "high", label: "High and affecting daily work" },
        ],
      },
      {
        key: "reporting",
        label: "Current operational reporting",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select current state" },
          { value: "none", label: "No shared reporting" },
          { value: "manual", label: "Manual reports or spreadsheets" },
          { value: "dashboard", label: "A reliable dashboard already exists" },
        ],
      },
    ],
  },
  {
    key: "web_seo",
    title: "Professional Websites / Web & SEO",
    shortTitle: "Web & SEO",
    summary: "Clarify the offer, audience, content and technical starting point.",
    questions: [
      { key: "currentWebsite", label: "Current website URL", type: "text", help: "Leave blank if no website exists." },
      {
        key: "websiteState",
        label: "Current website state",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select current state" },
          { value: "none", label: "No website" },
          { value: "replace", label: "Existing website should be replaced" },
          { value: "improve", label: "Existing website should be improved" },
          { value: "landing", label: "Only a focused landing page is needed" },
        ],
      },
      {
        key: "solutionShape",
        label: "Expected solution shape",
        type: "select",
        required: true,
        help: "This selects the static or custom provisioning route.",
        options: [
          { value: "", label: "Select a solution shape" },
          { value: "informative", label: "Informative website or landing page" },
          { value: "custom_app", label: "Custom web application" },
          { value: "ecommerce", label: "Ecommerce" },
          { value: "unknown", label: "Requires technical review" },
        ],
      },
      {
        key: "contentManagement",
        label: "Does the client need to edit structured content?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "authentication",
        label: "Are private users or login required?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "dataPersistence",
        label: "Must the solution store operational data?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "payments",
        label: "Are online payments required?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "externalIntegrations",
        label: "External integration complexity",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select integration scope" },
          { value: "none", label: "No external integration" },
          { value: "standard", label: "One or two standard integrations" },
          { value: "custom", label: "Custom or multiple integrations" },
          { value: "unknown", label: "Requires technical review" },
        ],
      },
      { key: "coreOffer", label: "Main offer the website must explain", type: "textarea", required: true },
      { key: "targetLocations", label: "Target cities or regions", type: "text", required: true },
      { key: "requiredPages", label: "Known pages or sections", type: "textarea" },
      {
        key: "contentReady",
        label: "Are approved text and images available?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "languages",
        label: "Language scope",
        type: "select",
        section: "discovery",
        options: [
          { value: "", label: "Select language scope" },
          { value: "single", label: "One language" },
          { value: "multilingual", label: "Two or more languages" },
          { value: "unknown", label: "Requires discovery" },
        ],
      },
      {
        key: "platformPreference",
        label: "Platform preference",
        type: "select",
        section: "discovery",
        help: "A preference is not a final architecture decision.",
        options: [
          { value: "", label: "No preference recorded" },
          { value: "managed_builder", label: "Managed builder / CMS" },
          { value: "wordpress", label: "WordPress" },
          { value: "shopify", label: "Shopify" },
          { value: "custom", label: "Custom implementation" },
          { value: "unknown", label: "Requires technical review" },
        ],
      },
      {
        key: "maintenanceOwner",
        label: "Who will maintain content after launch?",
        type: "select",
        section: "discovery",
        options: [
          { value: "", label: "Not discussed" },
          { value: "client", label: "Client team" },
          { value: "altaira", label: "Altaira managed support" },
          { value: "shared", label: "Shared responsibility" },
          { value: "unknown", label: "Requires agreement" },
        ],
      },
    ],
  },
  {
    key: "booking",
    title: "Booking Systems",
    shortTitle: "Booking",
    summary: "Capture the real scheduling rules before choosing a booking solution.",
    questions: [
      { key: "bookingType", label: "What is being booked?", type: "text", required: true, help: "Appointments, tables, rooms, advisors or another resource." },
      {
        key: "currentBookingProcess",
        label: "Current booking process",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a process" },
          { value: "calls_messages", label: "Calls and messages" },
          { value: "calendar", label: "Shared calendar" },
          { value: "existing_tool", label: "Existing booking tool" },
        ],
      },
      { key: "openingHours", label: "Opening hours or shift structure", type: "textarea", required: true },
      { key: "resources", label: "Bookable resources and capacity", type: "textarea", required: true },
      { key: "slotDuration", label: "Typical slot duration", type: "text", required: true },
      {
        key: "depositRequired",
        label: "Should bookings support deposits or payment?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "resourceCount",
        label: "Approximate number of bookable resources",
        type: "number",
        section: "discovery",
        min: 1,
        max: 500,
      },
      {
        key: "locationCount",
        label: "Number of business locations",
        type: "number",
        section: "discovery",
        min: 1,
        max: 100,
      },
      {
        key: "calendarProvider",
        label: "Calendar or booking provider",
        type: "select",
        section: "discovery",
        options: [
          { value: "", label: "No provider selected" },
          { value: "google", label: "Google Calendar" },
          { value: "microsoft", label: "Microsoft 365 / Bookings" },
          { value: "calcom", label: "Cal.com" },
          { value: "other", label: "Another provider" },
          { value: "none", label: "No existing provider" },
        ],
      },
      {
        key: "cancellationPolicy",
        label: "Cancellation or rescheduling rule",
        type: "textarea",
        section: "discovery",
        help: "Record the rule, not payment credentials or private customer data.",
      },
    ],
  },
  {
    key: "crm",
    title: "CRM / Lead Management",
    shortTitle: "CRM",
    summary: "Define the lead journey, fields and migration needs without overbuilding.",
    questions: [
      {
        key: "currentLeadProcess",
        label: "Current lead follow-up process",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a process" },
          { value: "messages_email", label: "Messages and email" },
          { value: "spreadsheet", label: "Spreadsheet" },
          { value: "existing_crm", label: "Existing CRM" },
        ],
      },
      { key: "leadSources", label: "Main lead sources", type: "textarea", required: true },
      { key: "pipelineStages", label: "Known lead stages", type: "textarea", help: "Example: New, contacted, proposal, won, lost." },
      { key: "requiredFields", label: "Information needed on each lead", type: "textarea", required: true },
      { key: "monthlyVolume", label: "Approximate enquiries per month", type: "text" },
      {
        key: "importRequired",
        label: "Is an existing contact import required?",
        type: "select",
        required: true,
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "userCount",
        label: "Expected CRM users",
        type: "number",
        section: "discovery",
        min: 1,
        max: 500,
      },
      {
        key: "keepOrReplace",
        label: "Keep or replace the existing CRM?",
        type: "select",
        section: "discovery",
        visibleWhen: { key: "currentLeadProcess", values: ["existing_crm"] },
        options: [
          { value: "", label: "Select an approach" },
          { value: "keep_integrate", label: "Keep and integrate it" },
          { value: "reconfigure", label: "Keep and reconfigure it" },
          { value: "replace", label: "Replace it" },
          { value: "unknown", label: "Requires discovery" },
        ],
      },
    ],
  },
  {
    key: "automation",
    title: "Workflow Automation",
    shortTitle: "Automation",
    summary: "Start from one measurable repetitive process and its failure path.",
    questions: [
      { key: "currentProcess", label: "Process to automate", type: "textarea", required: true },
      { key: "trigger", label: "What starts the process?", type: "text", required: true },
      { key: "expectedAction", label: "What should happen automatically?", type: "textarea", required: true },
      { key: "channels", label: "Channels involved", type: "text", help: "For example email, forms, CRM or calendar. Do not enter passwords." },
      { key: "monthlyVolume", label: "Approximate monthly volume", type: "text" },
      { key: "failureHandling", label: "What should happen when automation fails?", type: "textarea", required: true },
      { key: "sourceSystem", label: "Source system", type: "text", section: "discovery", help: "Name the system only. Never enter credentials." },
      { key: "destinationSystem", label: "Destination system", type: "text", section: "discovery", help: "Name the system only. Never enter credentials." },
      {
        key: "approvalWorkflow",
        label: "Must a person approve the action before execution?",
        type: "select",
        section: "discovery",
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "criticality",
        label: "Operational criticality",
        type: "select",
        section: "discovery",
        options: [
          { value: "", label: "Select criticality" },
          { value: "low", label: "Low - manual recovery is acceptable" },
          { value: "medium", label: "Medium - same-day recovery is needed" },
          { value: "high", label: "High - interruption affects live operations" },
          { value: "unknown", label: "Requires technical review" },
        ],
      },
    ],
  },
  {
    key: "dashboard",
    title: "Management Dashboards",
    shortTitle: "Dashboard",
    summary: "Identify decisions, trusted data sources and intended users.",
    questions: [
      { key: "decisions", label: "Decisions the dashboard should support", type: "textarea", required: true },
      { key: "kpis", label: "Known KPIs", type: "textarea", required: true },
      { key: "dataSources", label: "Current data sources", type: "textarea", required: true },
      {
        key: "updateFrequency",
        label: "Required update frequency",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select frequency" },
          { value: "realtime", label: "Near real time" },
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ],
      },
      { key: "users", label: "Who needs access?", type: "textarea", required: true },
      {
        key: "currentReporting",
        label: "Current reporting method",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select current method" },
          { value: "none", label: "No regular reporting" },
          { value: "spreadsheets", label: "Spreadsheets" },
          { value: "manual_reports", label: "Manual reports" },
          { value: "existing_dashboard", label: "Existing dashboard" },
        ],
      },
      {
        key: "viewerType",
        label: "Who will view the dashboard?",
        type: "select",
        section: "discovery",
        options: [
          { value: "", label: "Select viewers" },
          { value: "owner", label: "Business owner only" },
          { value: "internal_team", label: "Internal team" },
          { value: "clients", label: "External clients" },
          { value: "mixed", label: "Internal and external viewers" },
        ],
      },
      {
        key: "financialData",
        label: "Will the dashboard include financial data?",
        type: "select",
        section: "discovery",
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
      {
        key: "exportRequired",
        label: "Are scheduled exports or reports required?",
        type: "select",
        section: "discovery",
        options: [{ value: "", label: "Select an answer" }, ...yesNoUnknown],
      },
    ],
  },
]

export const COMMERCIAL_INTAKE_QUESTIONS: LeadQuestion[] = [
  {
    key: "budgetBand",
    label: "Indicative budget band",
    type: "select",
    section: "commercial",
    options: [
      { value: "", label: "Not discussed" },
      { value: "under_2500", label: "Under EUR 2,500" },
      { value: "2500_5000", label: "EUR 2,500 - 5,000" },
      { value: "5000_10000", label: "EUR 5,000 - 10,000" },
      { value: "10000_plus", label: "EUR 10,000+" },
      { value: "unknown", label: "Needs commercial discovery" },
    ],
  },
  {
    key: "targetTimeline",
    label: "Target timeline",
    type: "select",
    section: "commercial",
    options: [
      { value: "", label: "Not discussed" },
      { value: "under_1_month", label: "Under one month" },
      { value: "1_3_months", label: "One to three months" },
      { value: "3_6_months", label: "Three to six months" },
      { value: "flexible", label: "Flexible" },
    ],
  },
  {
    key: "commercialStage",
    label: "Commercial stage",
    type: "select",
    section: "commercial",
    options: [
      { value: "", label: "Not assessed" },
      { value: "exploring", label: "Exploring options" },
      { value: "needs_approval", label: "Internal approval needed" },
      { value: "ready_for_proposal", label: "Ready for a proposal" },
    ],
  },
]

export const INTERNAL_TECHNICAL_QUESTIONS: LeadQuestion[] = [
  {
    key: "sensitiveData",
    label: "Could the solution process sensitive or regulated data?",
    type: "select",
    section: "internal",
    help: "Record the category only. Never paste personal records, passwords or secrets.",
    options: [{ value: "", label: "Not reviewed" }, ...yesNoUnknown],
  },
  {
    key: "serviceSelectionConfirmation",
    label: "Is the proposed service scope confirmed?",
    type: "select",
    section: "internal",
    options: [
      { value: "", label: "Not reviewed" },
      { value: "confirmed", label: "Confirmed by admin" },
      { value: "needs_discovery", label: "Needs discovery" },
      { value: "needs_client_confirmation", label: "Needs client confirmation" },
    ],
  },
  {
    key: "internalTechnicalNotes",
    label: "Internal technical notes",
    type: "textarea",
    section: "internal",
    help: "Architecture assumptions only. Do not store credentials or customer datasets here.",
  },
]

export type LeadQuestionSection = {
  key: "requirements" | "discovery" | "commercial" | "internal"
  title: string
  summary: string
  questions: LeadQuestion[]
  collapsed?: boolean
}

export function leadQuestionSections(definition: LeadFormDefinition): LeadQuestionSection[] {
  const requirements = definition.questions.filter((question) => (question.section ?? "requirements") === "requirements")
  const discovery = definition.questions.filter((question) => question.section === "discovery")

  return [
    {
      key: "requirements",
      title: definition.key === "general" ? "Diagnostic questions" : "Core requirements",
      summary: definition.key === "general"
        ? "Short qualification signals used to recommend the next service."
        : "Information required to produce the first explainable plan.",
      questions: requirements,
    },
    ...(discovery.length > 0 ? [{
      key: "discovery" as const,
      title: "Discovery details",
      summary: "Only complete details that are already known. Unknowns remain visible for discovery.",
      questions: discovery,
      collapsed: true,
    }] : []),
    {
      key: "commercial",
      title: "Commercial fit",
      summary: "Planning context only. Saving the intake does not approve or purchase anything.",
      questions: COMMERCIAL_INTAKE_QUESTIONS,
      collapsed: true,
    },
    {
      key: "internal",
      title: "Internal technical review",
      summary: "Admin-only risk and scope signals. Never enter credentials or personal datasets.",
      questions: INTERNAL_TECHNICAL_QUESTIONS,
      collapsed: true,
    },
  ]
}

export function isLeadQuestionVisible(question: LeadQuestion, responses: Record<string, string>) {
  if (!question.visibleWhen) return true
  return question.visibleWhen.values.includes(responses[question.visibleWhen.key] || "")
}

export const LAUNCH_SERVICE_OPTIONS = LEAD_FORM_DEFINITIONS
  .filter((definition) => definition.key !== "general")
  .map((definition) => ({
    value: definition.key,
    label: definition.shortTitle,
  }))

export function leadFormDefinition(key: string) {
  return LEAD_FORM_DEFINITIONS.find((definition) => definition.key === key)
}

export function serviceLabel(key: string) {
  return LAUNCH_SERVICE_OPTIONS.find((option) => option.value === key)?.label ?? key
}
