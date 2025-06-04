"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Brain, Bot, Zap, Cog, BarChart3, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useInView } from "@/hooks/use-in-view"

export default function OurSolutions() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-32 md:py-40">
        <div className="container mx-auto px-4">
          <div
            className={cn(
              "max-w-3xl mx-auto text-center transform transition-all duration-1000 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our AI Solutions</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Comprehensive AI services designed to transform your business at every stage of your AI journey.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {solutions.map((solution, index) => (
              <SolutionItem key={index} solution={solution} index={index} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button asChild variant="outline" size="lg" className="transition-transform duration-300 hover:scale-105">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SolutionItem({ solution, index }: { solution: any; index: number }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(itemRef, { once: true, threshold: 0.1 })
  const [expandedService, setExpandedService] = useState<number | null>(null)

  const toggleService = (idx: number) => {
    setExpandedService(expandedService === idx ? null : idx)
  }

  // Different animation for each solution type
  const getAnimationClass = () => {
    switch (solution.title) {
      case "AI Strategy":
        return "fade-in-slide-up"
      case "AI Development":
        return "fade-in-blur"
      case "AI Automation":
        return "fade-in-scale"
      case "AI Operation":
        return "fade-in-slide-left"
      case "AI Research & Insights":
        return "fade-in-slide-right"
      default:
        return "fade-in"
    }
  }

  return (
    <div
      ref={itemRef}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transform transition-all duration-1000 ease-out",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
      )}
    >
      <div className={`order-2 ${index % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}>
        <div
          className={cn(
            "bg-slate-100 p-8 rounded-2xl relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300",
            getAnimationClass(),
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-bl-3xl"></div>
          <div className="relative">
            <div className="bg-white p-3 rounded-full inline-block mb-6 shadow-md">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                {solution.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 hover:text-blue-600 transition-colors duration-300">
              {solution.title}
            </h3>
            <p className="text-slate-700 mb-6">{solution.description}</p>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Services Included:</h4>
              <ul className="space-y-3">
                {solution.services.map((service: any, idx: number) => (
                  <li key={idx} className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-300">
                    <button
                      onClick={() => toggleService(idx)}
                      className="w-full text-left p-4 flex items-start justify-between"
                    >
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                          <div className="bg-blue-500 w-2 h-2 rounded-full"></div>
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      {expandedService === idx ? (
                        <ChevronUp className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-500" />
                      )}
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        expandedService === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="p-4 pt-0 text-slate-600 border-t">{service.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className={index % 2 === 0 ? "lg:order-1" : "lg:order-2"}>
        <div
          className={cn(
            "bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl h-64 md:h-80 flex items-center justify-center transform transition-all duration-500",
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-95",
            "hover:shadow-lg hover:scale-[1.02] transition-all duration-300",
          )}
        >
          <div className="text-white text-8xl opacity-30">{solution.icon}</div>
        </div>
      </div>
    </div>
  )
}

const solutions = [
  {
    title: "AI Strategy",
    description:
      "Definimos la hoja de ruta para implementar IA en tu negocio, alineando las soluciones tecnológicas con tus objetivos empresariales.",
    icon: <Brain className="h-6 w-6 text-white" />,
    services: [
      {
        name: "Consultoría I.A.",
        description: "Evaluamos tus necesidades y proponemos estrategias efectivas de IA.",
      },
      {
        name: "Análisis de Datos",
        description: "Convertimos datos en información valiosa para una toma de decisiones informada.",
      },
    ],
  },
  {
    title: "AI Development",
    description:
      "Desarrollamos soluciones de IA personalizadas que resuelven problemas específicos de tu negocio, desde la idea hasta la implementación.",
    icon: <Bot className="h-6 w-6 text-white" />,
    services: [
      {
        name: "Desarrollo de Chatbots",
        description: "Creamos asistentes virtuales que mejoran la atención al cliente y la eficiencia operativa.",
      },
      {
        name: "Desarrollo de Aplicaciones Personalizadas",
        description:
          "Diseñamos y construimos aplicaciones de IA que se ajustan a las necesidades específicas de tu empresa.",
      },
    ],
  },
  {
    title: "AI Automation",
    description:
      "Automatizamos procesos clave para mejorar la eficiencia, reducir costos y permitir que tu equipo se enfoque en lo que realmente importa.",
    icon: <Zap className="h-6 w-6 text-white" />,
    services: [
      {
        name: "Automatización de Tareas",
        description: "Implementamos soluciones que liberan a tu equipo de tareas repetitivas y manuales.",
      },
    ],
  },
  {
    title: "AI Operation",
    description:
      "Aseguramos que tus soluciones de IA funcionen de manera óptima y se mantengan actualizadas a medida que evolucionan tus necesidades empresariales.",
    icon: <Cog className="h-6 w-6 text-white" />,
    services: [
      {
        name: "Soporte y Mantenimiento",
        description: "Ofrecemos asistencia continua para garantizar que tus sistemas de IA operen sin problemas.",
      },
    ],
  },
  {
    title: "AI Research & Insights",
    description:
      "Investigamos nuevas tendencias y tecnologías en IA para mantener a tu negocio a la vanguardia del mercado.",
    icon: <BarChart3 className="h-6 w-6 text-white" />,
    services: [
      {
        name: "Consultoría I.A. (Investigación de Nuevas Tecnologías)",
        description: "Exploramos y sugerimos nuevas oportunidades de IA para tu negocio.",
      },
      {
        name: "Análisis de Datos Avanzados",
        description: "Realizamos estudios profundos para descubrir patrones y oportunidades ocultas en tus datos.",
      },
    ],
  },
]

