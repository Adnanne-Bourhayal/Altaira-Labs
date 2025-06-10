"use client"

import { useState } from "react"
import { Brain, Zap, BarChart3, Code, ArrowRight, CheckCircle } from "lucide-react"

const services = [
  {
    icon: Brain,
    title: "Consultoría en IA",
    description: "Estrategias personalizadas para integrar IA en tu negocio",
    features: ["Análisis de necesidades", "Roadmap tecnológico", "Implementación guiada"],
    price: "Desde 1.500€",
    popular: false,
  },
  {
    icon: Zap,
    title: "Automatización",
    description: "Automatiza procesos y libera tiempo para lo importante",
    features: ["Automatización con Make", "Integración de sistemas", "Monitoreo 24/7"],
    price: "Desde 800€",
    popular: true,
  },
  {
    icon: Code,
    title: "Desarrollo Web",
    description: "Aplicaciones web modernas que impulsan tu presencia digital",
    features: ["Diseño responsive", "SEO optimizado", "Integración con APIs"],
    price: "Desde 2.500€",
    popular: false,
  },
  {
    icon: BarChart3,
    title: "Análisis de Datos",
    description: "Dashboards para decisiones basadas en datos",
    features: ["Dashboards personalizados", "Reportes automáticos", "Análisis predictivo"],
    price: "Desde 1.200€",
    popular: false,
  },
]

export default function Services() {
  const [hoveredService, setHoveredService] = useState<number | null>(null)

  const handleMasInfoClick = (serviceTitle: string) => {
    const contactSection = document.getElementById("contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
      // Simular selección del servicio en el formulario
      setTimeout(() => {
        const serviceSelect = document.querySelector('select[name="service"]') as HTMLSelectElement
        if (serviceSelect) {
          const serviceMap: { [key: string]: string } = {
            "Consultoría en IA": "consultoria-ia",
            Automatización: "automatizacion",
            "Desarrollo Web": "desarrollo-web",
            "Análisis de Datos": "analisis-datos",
          }
          serviceSelect.value = serviceMap[serviceTitle] || ""
        }
      }, 500)
    }
  }

  const handleConsultaClick = () => {
    const contactSection = document.getElementById("contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="servicios" className="py-20 relative bg-slate-950">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
            Nuestros{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Servicios
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Soluciones tecnológicas integrales para digitalizar tu empresa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const IconComponent = service.icon
            return (
              <div
                key={index}
                className={`relative group cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                  hoveredService === index ? "z-10" : ""
                }`}
                onMouseEnter={() => setHoveredService(index)}
                onMouseLeave={() => setHoveredService(null)}
              >
                {/* Popular badge */}
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                      Más Popular
                    </div>
                  </div>
                )}

                <div
                  className={`relative h-full bg-gradient-to-br from-slate-800 to-slate-900 border rounded-2xl p-6 transition-all duration-500 ${
                    service.popular
                      ? "border-blue-500/50 shadow-lg shadow-blue-500/25"
                      : "border-slate-700 hover:border-blue-500/30"
                  } ${hoveredService === index ? "shadow-2xl shadow-blue-500/20" : ""}`}
                >
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
                        service.popular
                          ? "bg-gradient-to-br from-blue-600 to-purple-600"
                          : "bg-gradient-to-br from-slate-700 to-slate-600 group-hover:from-blue-600 group-hover:to-purple-600"
                      }`}
                    >
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-100 mb-3">{service.title}</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed text-sm">{service.description}</p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2 text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div className="text-blue-400 font-bold text-lg">{service.price}</div>
                      <button
                        onClick={() => handleMasInfoClick(service.title)}
                        className="group/btn flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span className="text-sm font-medium">Más info</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">¿No estás seguro qué servicio necesitas?</h3>
            <p className="text-slate-400 mb-6 font-light">
              Agenda una consulta gratuita y te ayudamos a identificar las mejores soluciones.
            </p>
            <button
              onClick={handleConsultaClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-white"
            >
              Consulta Gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
