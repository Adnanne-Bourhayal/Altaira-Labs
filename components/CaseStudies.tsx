"use client"

import { useState } from "react"
import { ArrowRight, TrendingUp, Clock, DollarSign, Users } from "lucide-react"

const caseStudies = [
  {
    title: "Restaurante La Paella Digital",
    industry: "Restauración",
    challenge: "Gestión manual de pedidos y reservas causaba errores y pérdida de clientes",
    solution: "Sistema de reservas automatizado + chatbot para pedidos + análisis de ventas",
    results: [
      { icon: TrendingUp, value: "+150%", label: "Pedidos online" },
      { icon: Clock, value: "-60%", label: "Tiempo de gestión" },
      { icon: DollarSign, value: "+40%", label: "Ingresos mensuales" },
    ],
    testimonial:
      "Altaira Labs transformó completamente nuestro negocio. Ahora podemos enfocarnos en la cocina mientras la tecnología maneja el resto.",
    client: "María González, Propietaria",
  },
  {
    title: "Clínica Dental Sonrisa",
    industry: "Salud",
    challenge: "Recordatorios manuales de citas y seguimiento de pacientes ineficiente",
    solution: "Automatización de recordatorios + CRM personalizado + análisis de satisfacción",
    results: [
      { icon: Users, value: "+80%", label: "Retención pacientes" },
      { icon: Clock, value: "-70%", label: "Tiempo administrativo" },
      { icon: TrendingUp, value: "+25%", label: "Nuevos pacientes" },
    ],
    testimonial:
      "La automatización nos permitió dedicar más tiempo a nuestros pacientes y menos a tareas administrativas.",
    client: "Dr. Carlos Ruiz, Director",
  },
  {
    title: "Tienda Online ModaStyle",
    industry: "E-commerce",
    challenge: "Gestión manual de inventario y atención al cliente 24/7 imposible",
    solution: "Chatbot inteligente + automatización de inventario + análisis predictivo de ventas",
    results: [
      { icon: DollarSign, value: "+200%", label: "Ventas online" },
      { icon: Users, value: "24/7", label: "Atención cliente" },
      { icon: TrendingUp, value: "+90%", label: "Satisfacción cliente" },
    ],
    testimonial:
      "Nunca pensé que una pequeña tienda como la mía pudiera competir con las grandes. Ahora vendemos las 24 horas.",
    client: "Ana Martín, Fundadora",
  },
]

export default function CaseStudies() {
  const [activeCase, setActiveCase] = useState(0)

  const handleEmpezarTransformacionClick = () => {
    const contactSection = document.getElementById("contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="casos" className="py-20 bg-slate-950 relative">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-20 animate-pulse"
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
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
            Casos de{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Éxito</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Descubre cómo hemos ayudado a empresas como la tuya a transformarse digitalmente
          </p>
          <div className="mt-6 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 inline-block">
            * Casos basados en proyectos reales con datos aproximados
          </div>
        </div>

        {/* Case Study Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {caseStudies.map((study, index) => (
            <button
              key={index}
              onClick={() => setActiveCase(index)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCase === index
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {study.title}
            </button>
          ))}
        </div>

        {/* Active Case Study */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content */}
            <div className="p-8 md:p-12">
              <div className="mb-6">
                <div className="text-blue-400 font-semibold mb-2">{caseStudies[activeCase].industry}</div>
                <h3 className="text-3xl font-bold text-slate-100 mb-4">{caseStudies[activeCase].title}</h3>
              </div>

              {/* Challenge */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-blue-400 mb-3">Desafío</h4>
                <p className="text-slate-300 leading-relaxed font-light">{caseStudies[activeCase].challenge}</p>
              </div>

              {/* Solution */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-purple-400 mb-3">Solución</h4>
                <p className="text-slate-300 leading-relaxed font-light">{caseStudies[activeCase].solution}</p>
              </div>

              {/* Results */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Resultados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {caseStudies[activeCase].results.map((result, index) => {
                    const IconComponent = result.icon
                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-600/50 rounded-xl p-4 text-center"
                      >
                        <IconComponent className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-100">{result.value}</div>
                        <div className="text-sm text-slate-400">{result.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/30 border border-slate-600/30 rounded-xl p-6">
                <p className="text-slate-300 italic mb-4 font-light">"{caseStudies[activeCase].testimonial}"</p>
                <div className="text-blue-400 font-semibold">{caseStudies[activeCase].client}</div>
              </div>
            </div>

            {/* Image */}
            <div className="relative bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center p-8">
              <div className="w-full h-64 lg:h-full bg-slate-800 rounded-2xl flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-lg font-semibold">Dashboard de Resultados</div>
                  <div className="text-sm">Métricas en tiempo real</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">¿Quieres ser nuestro próximo caso de éxito?</h3>
            <p className="text-slate-400 mb-6 font-light">
              Agenda una consulta gratuita y descubre cómo podemos transformar tu empresa.
            </p>
            <button
              onClick={handleEmpezarTransformacionClick}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto text-white"
            >
              <span>Empezar Mi Transformación</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
