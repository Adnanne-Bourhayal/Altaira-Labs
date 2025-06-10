import Header from "@/components/Header"
import Hero from "@/components/Hero"
import Services from "@/components/Services"
import About from "@/components/About"
import CaseStudies from "@/components/CaseStudies"
import Testimonials from "@/components/Testimonials"
import Blog from "@/components/Blog"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Header />
      <Hero />
      <Services />
      <About />
      <CaseStudies />
      <Testimonials />
      <Blog />
      <Contact />
      <Footer />
    </main>
  )
}
