import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactTray from "@/components/public/ContactTray"
import { getServiceBySlug } from "@/lib/public-site-data"

export const metadata = {
  title: "Contact | Altaira Labs",
  description:
    "Contact Altaira Labs for a practical consultation about websites, booking systems, dashboards, CRM and workflow automation for local SMEs.",
}

type ContactPageProps = {
  searchParams?: Promise<{ service?: string }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = await searchParams
  const selectedService = resolvedSearchParams?.service ? getServiceBySlug(resolvedSearchParams.service) : null

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-32 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 scale-105 bg-contain bg-center bg-no-repeat opacity-80 blur-sm"
          style={{ backgroundImage: "url('/brand/header_background.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/68 backdrop-blur-[2px]" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Contact</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">Contact Altaira Labs</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Tell us what business you run and what process you want to improve.
            </p>
          </div>
          <ContactTray
            dark
            compact
            title="Send your request"
            description="A short message is enough. We will reply with the next practical step."
            contextLabel={selectedService ? `Service request: ${selectedService.title}` : "Contact request"}
            leadIndustry={selectedService ? "Service request" : "Contact request"}
            serviceInterest={selectedService?.title}
            defaultMessage={selectedService?.contactMessage || "Hi Altaira Labs, I want to discuss a practical digital system for my business."}
            showEmailLink={false}
            showWhatsApp={false}
          />
        </div>
      </section>
      <Footer />
    </main>
  )
}
