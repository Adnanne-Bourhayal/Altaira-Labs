import ContactTray from "@/components/public/ContactTray"

export default function Contact() {
  return (
    <section id="contact" className="border-t border-slate-200 bg-white py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <ContactTray
          title="Contact us"
          description="Tell us your business, your current process and what you want to improve."
          contextLabel="Contact"
          leadIndustry="General contact"
          serviceInterest="General contact"
          defaultMessage="Hi Altaira Labs, I want to discuss a practical digital system for my business."
          showEmailLink={false}
          showWhatsApp={false}
        />
      </div>
    </section>
  )
}
