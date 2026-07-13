import Header from "@/components/Header"
import Hero from "@/components/Hero"
import { AboutSection, BlogPreviewSection, IndustriesSection } from "@/components/PublicSections"
import ServicesShowcase from "@/components/ServicesShowcase"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <Header />
      <Hero />
      <AboutSection />
      <IndustriesSection />
      <ServicesShowcase />
      <BlogPreviewSection />
      <Contact />
      <Footer />
    </main>
  )
}
