"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowLeft, Brain, Bot, Zap, Cog, BarChart3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AIQuestionnaire from "@/components/ai-questionnaire"
import GlassmorphismButton from "@/components/glassmorphism-button"
import FloatingChatbot from "@/components/floating-chatbot"

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Nuestros Servicios de IA</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Soluciones de inteligencia artificial diseñadas para transformar tu negocio
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <GlassmorphismButton
                variant="primary"
                onClick={() => {
                  setActiveTab("questionnaire")
                  setTimeout(() => {
                    document.getElementById("services-tabs")?.scrollIntoView({ behavior: "smooth" })
                  }, 100)
                }}
                className="group"
              >
                Descubre tu Solución Ideal
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </GlassmorphismButton>

              <GlassmorphismButton variant="outline" href="/" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Volver al Inicio
              </GlassmorphismButton>
            </div>
          </div>
        </div>
      </section>

      {/* Services Tabs */}
      <section id="services-tabs" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full max-w-4xl">
                <TabsTrigger value="overview" className="text-sm md:text-base">
                  Visión General
                </TabsTrigger>
                <TabsTrigger value="strategy" className="text-sm md:text-base">
                  AI Strategy
                </TabsTrigger>
                <TabsTrigger value="development" className="text-sm md:text-base">
                  AI Development
                </TabsTrigger>
                <TabsTrigger value="automation" className="text-sm md:text-base">
                  AI Automation
                </TabsTrigger>
                <TabsTrigger value="operation" className="text-sm md:text-base">
                  AI Operation
                </TabsTrigger>
                <TabsTrigger value="questionnaire" className="text-sm md:text-base">
                  Cuestionario
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-8">
              <TabsContent value="overview" className="mt-0">
                <ServicesOverview setActiveTab={setActiveTab} />
              </TabsContent>

              <TabsContent value="strategy" className="mt-0">
                <ServiceDetail
                  title="AI Strategy"
                  description="Definimos la hoja de ruta para implementar IA en tu negocio, alineando las soluciones tecnológicas con tus objetivos empresariales."
                  icon={<Brain className="h-10 w-10 text-white" />}
                  benefits={[
                    "Evaluación de madurez digital y oportunidades de IA",
                    "Desarrollo de roadmap estratégico de implementación",
                    "Análisis de retorno de inversión (ROI) de iniciativas de IA",
                    "Alineación de soluciones tecnológicas con objetivos de negocio",
                  ]}
                  features={[
                    {
                      title: "Consultoría Estratégica",
                      description:
                        "Evaluamos tus necesidades y proponemos estrategias efectivas de IA que se alinean con tus objetivos de negocio.",
                    },
                    {
                      title: "Análisis de Datos",
                      description:
                        "Convertimos tus datos en información valiosa para una toma de decisiones informada y estratégica.",
                    },
                    {
                      title: "Workshops de Innovación",
                      description:
                        "Sesiones colaborativas para identificar oportunidades de IA y desarrollar casos de uso específicos para tu industria.",
                    },
                  ]}
                  caseStudy={{
                    title: "Transformación Digital en Sector Financiero",
                    description:
                      "Ayudamos a una entidad financiera a desarrollar una estrategia de IA que resultó en un aumento del 30% en la eficiencia operativa y una mejora del 25% en la satisfacción del cliente.",
                    results: [
                      "30% aumento en eficiencia operativa",
                      "25% mejora en satisfacción del cliente",
                      "Reducción del 40% en tiempos de procesamiento",
                    ],
                  }}
                />
              </TabsContent>

              <TabsContent value="development" className="mt-0">
                <ServiceDetail
                  title="AI Development"
                  description="Desarrollamos soluciones de IA personalizadas que resuelven problemas específicos de tu negocio, desde la idea hasta la implementación."
                  icon={<Bot className="h-10 w-10 text-white" />}
                  benefits={[
                    "Soluciones a medida adaptadas a tus necesidades específicas",
                    "Integración con sistemas existentes",
                    "Desarrollo ágil con entregas incrementales",
                    "Soporte técnico especializado durante todo el proceso",
                  ]}
                  features={[
                    {
                      title: "Desarrollo de Chatbots",
                      description:
                        "Creamos asistentes virtuales inteligentes que mejoran la atención al cliente y la eficiencia operativa.",
                    },
                    {
                      title: "Sistemas de Recomendación",
                      description:
                        "Implementamos algoritmos que analizan comportamientos y preferencias para ofrecer recomendaciones personalizadas.",
                    },
                    {
                      title: "Procesamiento de Lenguaje Natural",
                      description:
                        "Desarrollamos soluciones que permiten a tus sistemas comprender y generar lenguaje humano.",
                    },
                  ]}
                  caseStudy={{
                    title: "Chatbot para Atención al Cliente",
                    description:
                      "Desarrollamos un chatbot inteligente para una empresa de telecomunicaciones que ahora maneja el 70% de las consultas sin intervención humana, reduciendo costos y mejorando la satisfacción del cliente.",
                    results: [
                      "70% de consultas resueltas automáticamente",
                      "Reducción del 45% en costos de atención",
                      "Disponibilidad 24/7",
                    ],
                  }}
                />
              </TabsContent>

              <TabsContent value="automation" className="mt-0">
                <ServiceDetail
                  title="AI Automation"
                  description="Automatizamos procesos clave para mejorar la eficiencia, reducir costos y permitir que tu equipo se enfoque en lo que realmente importa."
                  icon={<Zap className="h-10 w-10 text-white" />}
                  benefits={[
                    "Reducción de tareas manuales y repetitivas",
                    "Minimización de errores humanos",
                    "Aumento de la productividad del equipo",
                    "Escalabilidad de operaciones sin incrementar costos proporcionalmente",
                  ]}
                  features={[
                    {
                      title: "Automatización de Procesos",
                      description:
                        "Implementamos soluciones que automatizan flujos de trabajo completos, desde la entrada de datos hasta la generación de informes.",
                    },
                    {
                      title: "Procesamiento Inteligente de Documentos",
                      description:
                        "Extraemos información de documentos no estructurados utilizando técnicas avanzadas de IA.",
                    },
                    {
                      title: "Workflows Inteligentes",
                      description:
                        "Creamos flujos de trabajo que se adaptan y mejoran continuamente basados en datos y patrones.",
                    },
                  ]}
                  caseStudy={{
                    title: "Automatización de Procesos Financieros",
                    description:
                      "Implementamos una solución de automatización para el departamento financiero de una multinacional, reduciendo el tiempo de procesamiento de facturas en un 80% y eliminando errores manuales.",
                    results: [
                      "80% reducción en tiempo de procesamiento",
                      "99.9% precisión en datos",
                      "ROI positivo en 6 meses",
                    ],
                  }}
                />
              </TabsContent>

              <TabsContent value="operation" className="mt-0">
                <ServiceDetail
                  title="AI Operation"
                  description="Aseguramos que tus soluciones de IA funcionen de manera óptima y se mantengan actualizadas a medida que evolucionan tus necesidades empresariales."
                  icon={<Cog className="h-10 w-10 text-white" />}
                  benefits={[
                    "Monitoreo continuo del rendimiento de sistemas de IA",
                    "Actualizaciones y mejoras proactivas",
                    "Optimización constante basada en nuevos datos",
                    "Soporte técnico especializado",
                  ]}
                  features={[
                    {
                      title: "Mantenimiento y Soporte",
                      description:
                        "Ofrecemos asistencia continua para garantizar que tus sistemas de IA operen sin problemas y se mantengan actualizados.",
                    },
                    {
                      title: "Monitoreo de Rendimiento",
                      description:
                        "Implementamos sistemas de monitoreo que detectan y alertan sobre posibles problemas antes de que afecten a tu negocio.",
                    },
                    {
                      title: "Optimización Continua",
                      description:
                        "Mejoramos constantemente tus soluciones de IA basándonos en nuevos datos y cambios en tu negocio.",
                    },
                  ]}
                  caseStudy={{
                    title: "Optimización de Sistema de Recomendación",
                    description:
                      "Mejoramos el sistema de recomendación de un marketplace online, aumentando la tasa de conversión en un 35% y el valor promedio de compra en un 20%.",
                    results: [
                      "35% aumento en tasa de conversión",
                      "20% incremento en valor promedio de compra",
                      "Mejora continua del algoritmo",
                    ],
                  }}
                />
              </TabsContent>

              <TabsContent value="questionnaire" className="mt-0">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-center mb-8">Descubre tu Solución Ideal</h2>
                  <AIQuestionnaire />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  )
}

function ServicesOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  return (
    <div ref={containerRef} className="space-y-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Nuestras soluciones de IA están diseñadas para ayudarte a aprovechar el poder de la inteligencia artificial en
          cada etapa de tu viaje digital. Explora nuestros servicios o utiliza nuestro cuestionario para descubrir qué
          solución se adapta mejor a tus necesidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardHeader>
                <div className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                  {service.icon}
                </div>
                <CardTitle className="transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {service.title}
                </CardTitle>
                <CardDescription className="dark:text-slate-400">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-1">
                        <div className="bg-blue-500 w-2 h-2 rounded-full"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setActiveTab(service.id)} variant="outline" className="w-full group">
                  Ver Detalles
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">¿No estás seguro de qué solución necesitas?</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Responde nuestro cuestionario y te recomendaremos la solución que mejor se adapte a tus necesidades.
          </p>
        </div>
        <div className="flex justify-center">
          <GlassmorphismButton variant="primary" onClick={() => setActiveTab("questionnaire")} className="group">
            Comenzar Cuestionario
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassmorphismButton>
        </div>
      </div>
    </div>
  )
}

function ServiceDetail({
  title,
  description,
  icon,
  benefits,
  features,
  caseStudy,
}: {
  title: string
  description: string
  icon: React.ReactNode
  benefits: string[]
  features: { title: string; description: string }[]
  caseStudy: { title: string; description: string; results: string[] }
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, 100])

  return (
    <div ref={containerRef} className="space-y-16 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl h-64 md:h-80 flex items-center justify-center transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
            <div className="text-white text-8xl opacity-30">{icon}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">{description}</p>

          <h3 className="text-xl font-semibold mb-4">Beneficios</h3>
          <ul className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-3 mt-1">
                  <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                </div>
                <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
              </li>
            ))}
          </ul>

          <GlassmorphismButton variant="primary" href="/contact" className="group mt-4">
            Solicitar Información
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </GlassmorphismButton>
        </motion.div>
      </div>

      <motion.div style={{ opacity, y }} className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg">
        <h3 className="text-2xl font-bold mb-6 text-center">Características del Servicio</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-8 rounded-lg"
      >
        <h3 className="text-2xl font-bold mb-6">Caso de Éxito</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h4 className="text-xl font-semibold mb-3">{caseStudy.title}</h4>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{caseStudy.description}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">Resultados</h4>
            <ul className="space-y-3">
              {caseStudy.results.map((result, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-1">
                    <div className="bg-blue-500 w-2 h-2 rounded-full"></div>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{result}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="text-center">
        <GlassmorphismButton variant="primary" href="/contact" size="lg" className="group">
          Solicitar una Consulta Gratuita
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </GlassmorphismButton>
      </div>
    </div>
  )
}

const services = [
  {
    id: "strategy",
    title: "AI Strategy",
    description: "Define tu hoja de ruta de IA alineada con los objetivos de negocio",
    icon: <Brain className="h-6 w-6 text-white" />,
    features: [
      "Evaluación de madurez digital",
      "Roadmap estratégico de IA",
      "Análisis de ROI",
      "Workshops de innovación",
    ],
  },
  {
    id: "development",
    title: "AI Development",
    description: "Soluciones de IA personalizadas desde el concepto hasta la implementación",
    icon: <Bot className="h-6 w-6 text-white" />,
    features: [
      "Chatbots inteligentes",
      "Sistemas de recomendación",
      "Procesamiento de lenguaje natural",
      "Visión por computadora",
    ],
  },
  {
    id: "automation",
    title: "AI Automation",
    description: "Optimiza procesos y aumenta la eficiencia operativa",
    icon: <Zap className="h-6 w-6 text-white" />,
    features: [
      "Automatización de procesos",
      "Procesamiento inteligente de documentos",
      "Workflows adaptativos",
      "Reducción de tareas manuales",
    ],
  },
  {
    id: "operation",
    title: "AI Operation",
    description: "Mantén tus soluciones de IA funcionando de manera óptima",
    icon: <Cog className="h-6 w-6 text-white" />,
    features: [
      "Monitoreo continuo",
      "Optimización de rendimiento",
      "Actualizaciones y mejoras",
      "Soporte técnico especializado",
    ],
  },
  {
    id: "research",
    title: "AI Research",
    description: "Explora nuevas tendencias y tecnologías en IA",
    icon: <BarChart3 className="h-6 w-6 text-white" />,
    features: [
      "Investigación aplicada",
      "Pruebas de concepto",
      "Análisis de datos avanzado",
      "Descubrimiento de insights",
    ],
  },
]

