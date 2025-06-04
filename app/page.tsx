"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, ChevronRight, Zap, Brain, Bot, Cog, BarChart, Award, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useInView } from "@/hooks/use-in-view"
import EnhancedBackground from "@/components/enhanced-background"
import CountUp from "@/components/count-up"
import TestimonialsCarousel from "@/components/testimonials-carousel"
import ProjectsGrid from "@/components/projects-grid"
import FloatingChatbot from "@/components/floating-chatbot"
import GlassmorphismButton from "@/components/glassmorphism-button"
import { useTheme } from "next-themes"

export default function Home() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Hero Section with Enhanced Animated Background */}
      <HeroSection />

      {/* About Us Section */}
      <AboutUsSection />

      {/* Our Solutions Section */}
      <SolutionsSection />

      {/* Featured Services */}
      <FeaturedServicesSection />

      {/* Testimonials & Projects */}
      <TestimonialsSection />

      {/* Get Started Section */}
      <GetStartedSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  )
}

function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      {/* Enhanced Animated Background */}
      <EnhancedBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className={cn(
              "mb-6 flex justify-center transform transition-all duration-1000 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <div className="bg-white dark:bg-slate-800 p-3 rounded-full">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center animate-pulse">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-6xl font-bold text-white mb-6 transform transition-all duration-1000 ease-out delay-300",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            Impulsando el Futuro con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Inteligencia Artificial
            </span>
          </h1>
          <p
            className={cn(
              "text-lg md:text-xl text-slate-300 mb-8 transform transition-all duration-1000 ease-out delay-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            Soluciones de IA innovadoras que transforman negocios y potencian el crecimiento empresarial.
          </p>
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 ease-out delay-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <GlassmorphismButton href="/services" variant="accent" size="lg" className="group">
              Nuestras Soluciones{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </GlassmorphismButton>

            <GlassmorphismButton href="#contact" variant="outline" size="lg" className="group">
              Contactar{" "}
              <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </GlassmorphismButton>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-white flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-scroll-down"></div>
        </div>
      </div>
    </section>
  )
}

function AboutUsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={cn(
              "transform transition-all duration-1000 ease-out",
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20",
            )}
          >
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl h-80 md:h-96 overflow-hidden">
                <img
                  src="/placeholder.svg?height=600&width=800"
                  alt="Equipo de Altaira Labs"
                  className="w-full h-full object-cover mix-blend-overlay"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl">
                <div className="flex items-center space-x-4">
                  <Award className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-500">Reconocidos por</p>
                    <p className="font-bold">Innovación en IA 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "transform transition-all duration-1000 ease-out delay-300",
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20",
            )}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sobre <span className="text-blue-600 dark:text-blue-400">Nosotros</span>
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
              En Altaira Labs, combinamos experiencia técnica con visión estratégica para crear soluciones de IA que
              generan valor real para nuestros clientes. Nuestro equipo de expertos está comprometido con la excelencia
              y la innovación.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  <CountUp end={50} suffix="+" duration={2} />
                </div>
                <p className="text-slate-600 dark:text-slate-400">Proyectos Completados</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  <CountUp end={10} suffix="+" duration={2} />
                </div>
                <p className="text-slate-600 dark:text-slate-400">Años de Experiencia</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  <CountUp end={25} suffix="+" duration={2} />
                </div>
                <p className="text-slate-600 dark:text-slate-400">Expertos en IA</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  <CountUp end={95} suffix="%" duration={2} />
                </div>
                <p className="text-slate-600 dark:text-slate-400">Clientes Satisfechos</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium">Nuestra Misión</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Democratizar el acceso a la IA para empresas de todos los tamaños.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium">Nuestra Visión</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Ser líderes en la transformación digital impulsada por IA en Latinoamérica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SolutionsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "text-center mb-16 transform transition-all duration-700 ease-out",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestras Soluciones</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Servicios de IA diseñados para satisfacer las necesidades de tu negocio en cada etapa de tu viaje de
            transformación digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <SolutionCard key={index} solution={solution} index={index} isInView={isInView} />
          ))}
        </div>

        <div
          className={cn(
            "text-center mt-12 transform transition-all duration-700 ease-out delay-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <GlassmorphismButton href="/services" variant="primary" className="group">
            Ver Todas las Soluciones{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassmorphismButton>
        </div>
      </div>
    </section>
  )
}

function SolutionCard({ solution, index, isInView }: { solution: any; index: number; isInView: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 20
    const rotateY = (centerX - x) / 20

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "transform transition-all duration-700 ease-out perspective-1000",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
        `delay-${index * 200}`,
      )}
      style={{
        transitionDelay: `${index * 200}ms`,
        perspective: "1000px",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className="border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 h-full overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: "transform 0.3s ease",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader>
          <div className="mb-4 bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center">
            {solution.icon}
          </div>
          <CardTitle className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400">
            {solution.title}
          </CardTitle>
          <CardDescription className="dark:text-slate-400">{solution.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">{solution.feature}</div>
          </div>
        </CardContent>
        <CardFooter>
          <GlassmorphismButton href="/services" variant="secondary" className="w-full group">
            Ver Detalles{" "}
            <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassmorphismButton>
        </CardFooter>
      </Card>
    </div>
  )
}

function FeaturedServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <section id="featured-services" ref={sectionRef} className="py-20 md:py-28 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "text-center mb-16 transform transition-all duration-700 ease-out",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Servicios Destacados</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Nuestros servicios de IA más populares que aportan valor inmediato a tu negocio.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow md:flex hidden"
            aria-label="Scroll left"
          >
            <ChevronRight className="h-6 w-6 transform rotate-180" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {featuredServices.map((service, index) => (
              <div
                key={index}
                className={cn(
                  "min-w-[300px] md:min-w-[350px] snap-start transform transition-all duration-700 ease-out",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 h-full hover:scale-105 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="mr-3 text-blue-600 dark:text-blue-400">{service.icon}</div>
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">{service.description}</p>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium">{service.highlight}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <GlassmorphismButton href="/services" variant="outline" className="w-full group">
                      Ver Detalles{" "}
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </GlassmorphismButton>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow md:flex hidden"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "text-center mb-16 transform transition-all duration-700 ease-out",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Testimonios y Proyectos</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Descubre lo que nuestros clientes dicen sobre nosotros y explora algunos de nuestros proyectos destacados.
          </p>
        </div>

        <div
          className={cn(
            "mb-20 transform transition-all duration-700 ease-out delay-300",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <TestimonialsCarousel />
        </div>

        <div
          className={cn(
            "transform transition-all duration-700 ease-out delay-500",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h3 className="text-2xl font-bold mb-8 text-center">Proyectos Destacados</h3>
          <ProjectsGrid />
        </div>
      </div>
    </section>
  )
}

function GetStartedSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-gradient-to-r from-blue-500 to-purple-600 text-white relative overflow-hidden"
    >
      {/* Animated particles background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={cn(
            "max-w-3xl mx-auto text-center transform transition-all duration-700 ease-out",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para Transformar tu Negocio?</h2>
          <p className="text-lg mb-8">
            Contáctanos hoy para discutir cómo nuestras soluciones de IA pueden ayudarte a alcanzar tus objetivos
            empresariales.
          </p>
          <GlassmorphismButton href="/contact" variant="accent" size="lg" className="group">
            Comenzar Ahora{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassmorphismButton>
        </div>
      </div>
    </section>
  )
}

function NewsletterSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 })

  return (
    <section id="contact" ref={sectionRef} className="py-20 md:py-28 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "max-w-xl mx-auto transform transition-all duration-700 ease-out",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mantente Actualizado</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Suscríbete a nuestro newsletter para recibir las últimas novedades y conocimientos sobre IA.
            </p>
          </div>
          <Card className="border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6">
            <CardContent className="p-0">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="interest" className="block text-sm font-medium mb-1">
                    Área de interés
                  </label>
                  <select
                    id="interest"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="strategy">AI Strategy</option>
                    <option value="development">AI Development</option>
                    <option value="automation">AI Automation</option>
                    <option value="operation">AI Operation</option>
                    <option value="research">AI Research</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <GlassmorphismButton type="submit" variant="primary" className="group">
                    Suscribirse{" "}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </GlassmorphismButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

const solutions = [
  {
    title: "AI Strategy",
    description: "Define tu hoja de ruta de IA alineada con los objetivos de negocio",
    feature: "Incluye evaluación de necesidades, análisis de datos y planificación estratégica",
    icon: <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
  },
  {
    title: "AI Development",
    description: "Soluciones de IA personalizadas desde el concepto hasta la implementación",
    feature: "Desarrollo de chatbots, sistemas de recomendación y automatización inteligente",
    icon: <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
  },
  {
    title: "AI Automation",
    description: "Optimiza procesos y aumenta la eficiencia operativa",
    feature: "Automatización de tareas repetitivas y flujos de trabajo complejos",
    icon: <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
  },
  {
    title: "AI Operation",
    description: "Mantén tus soluciones de IA funcionando de manera óptima",
    feature: "Monitoreo continuo, mantenimiento y actualizaciones de sistemas",
    icon: <Cog className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
  },
  {
    title: "AI Research",
    description: "Explora nuevas tendencias y tecnologías en IA",
    feature: "Investigación aplicada y desarrollo de pruebas de concepto innovadoras",
    icon: <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
  },
]

const featuredServices = [
  {
    title: "Consultoría en IA",
    description:
      "Orientación experta para identificar las oportunidades de IA adecuadas para tu negocio y desarrollar un plan de implementación estratégico.",
    highlight: "Incluye evaluación de madurez digital y roadmap personalizado",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: "Desarrollo de Chatbots",
    description:
      "Agentes conversacionales inteligentes que mejoran la experiencia del cliente y optimizan las operaciones de soporte.",
    highlight: "Integración con múltiples plataformas y aprendizaje continuo",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: "Automatización de Procesos",
    description:
      "Soluciones de automatización impulsadas por IA que reducen el trabajo manual y aumentan la productividad en toda tu organización.",
    highlight: "Reducción de hasta un 70% en tareas manuales repetitivas",
    icon: <Cog className="h-5 w-5" />,
  },
  {
    title: "Análisis de Datos Avanzado",
    description:
      "Transforma tus datos sin procesar en información accionable con nuestras soluciones de análisis impulsadas por IA.",
    highlight: "Visualizaciones interactivas y paneles personalizados",
    icon: <BarChart className="h-5 w-5" />,
  },
]





