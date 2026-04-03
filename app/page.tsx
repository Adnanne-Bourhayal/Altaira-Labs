import Header from "@/components/Header"
import Hero from "@/components/Hero"
import BusinessTypes from "@/components/BusinessTypes"
import Examples from "@/components/Examples"
import Pricing from "@/components/Pricing"
import Results from "@/components/Results"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050810] text-white overflow-x-hidden">
      <Header />
      <Hero />
      <BusinessTypes />
      <Examples />
      <Pricing />
      <Results />
      <Contact />
      <Footer />
    </main>
  )
}
