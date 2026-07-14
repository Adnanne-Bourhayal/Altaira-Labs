export type LegalPage = {
  slug: string
  title: string
  description: string
  sections: {
    heading: string
    body: string
  }[]
}

export const legalPages: LegalPage[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How Altaira Labs handles contact requests and basic business information.",
    sections: [
      {
        heading: "Information collected",
        body: "The public forms collect the information needed to reply to a request: name, business, email, phone when provided and the message context.",
      },
      {
        heading: "Purpose",
        body: "The information is used to review the request, contact the business and prepare a practical first consultation.",
      },
      {
        heading: "Current limitation",
        body: "This is an initial policy page for the MVP website. A final production version should be reviewed before launch.",
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    description: "Current cookie and tracking position for the Altaira Labs website.",
    sections: [
      {
        heading: "Current use",
        body: "The current MVP website does not present a marketing cookie banner or advanced tracking flow.",
      },
      {
        heading: "Future use",
        body: "If analytics, advertising pixels or embedded third-party tools are added later, this page should be updated before production use.",
      },
      {
        heading: "Current limitation",
        body: "This is a practical placeholder policy for the academic and pre-launch website state.",
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    description: "Basic terms for using the public Altaira Labs website.",
    sections: [
      {
        heading: "Website use",
        body: "The website presents Altaira Labs services, sectors and contact routes for local businesses and small SMEs.",
      },
      {
        heading: "Estimates",
        body: "Calculator results and example scenarios are planning references, not guaranteed financial or operational results.",
      },
      {
        heading: "Current limitation",
        body: "These terms are a functional MVP page. A final legal version should be prepared before serious production launch.",
      },
    ],
  },
]

export function getLegalPageBySlug(slug: string) {
  return legalPages.find((page) => page.slug === slug)
}
