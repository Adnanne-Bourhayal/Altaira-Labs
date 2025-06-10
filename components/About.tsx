"use client"

import { useState, useEffect, useRef } from "react"
import { Globe, Users, Zap, Target, Award, TrendingUp } from "lucide-react"

const stats = [
  { icon: Users, value: "50+", label: "Empresas Transformadas", countTo: 50 },
  { icon: Zap, value: "200+", label: "Automatizaciones", countTo: 200 },
  { icon: TrendingUp, value: "300%", label: "ROI Promedio", countTo: 300, suffix: "%" },
  { icon: Award, value: "98%", label: "Satisfacción", countTo: 98, suffix: "%" },
]

const values = [
  {
    icon: Globe,
    title: "Visión Global",
    description: "Perspectivas europeas y árabes para soluciones que trascienden fronteras.",
  },
  {
    icon: Target,
    title: "Enfoque PYME",
    description: "Tecnología avanzada a precios accesibles para pequeñas empresas.",
  },
  {
    icon: Zap,
    title: "Innovación Constante",
    description: "Adaptación continua a nuevas tecnologías para mantenerte a la vanguardia.",
  },
]

export default function About() {
  const [activeValue, setActiveValue] = useState(0)
  const [counters, setCounters] = useState(stats.map(() => 0))
  const statsRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)

          stats.forEach((stat, index) => {
            const countTo = stat.countTo
            const duration = 2000 // ms
            const startTime = Date.now()

            const timer = setInterval(() => {
              const now = Date.now()
              const progress = Math.min((now - startTime) / duration, 1)

              setCounters((prev) => {
                const newCounters = [...prev]
                newCounters[index] = Math.floor(progress * countTo)
                return newCounters
              })

              if (progress === 1) {
                clearInterval(timer)
              }
            }, 50)
          })
        }
      },
      { threshold: 0.1 },
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current)
      }
    }
  }, [hasAnimated])

  const handleEmpezarClick = () => {
    const contactSection = document.getElementById("contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="nosotros" className="py-20 relative bg-slate-950">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
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
            Sobre{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Altaira Labs
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Democratizamos el acceso a la IA para pequeñas empresas
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-3xl p-8 md:p-12 mb-16 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-100 mb-6">Nuestra Misión</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-6 font-light">
                Ayudamos a las pequeñas empresas a <span className="text-blue-400 font-medium">digitalizarse</span> e
                integrarse en el mundo digital. Queremos que ninguna empresa se quede atrás en la revolución
                tecnológica.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed font-light">
                Ofrecemos <span className="text-purple-400 font-medium">tecnología avanzada</span> tradicionalmente
                reservada para grandes corporaciones, pero adaptada para PYMES.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl p-8">
                <h4 className="text-xl font-bold text-slate-100 mb-4">¿Por qué Altaira Labs?</h4>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Especialistas en tecnologías emergentes</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Precios accesibles para PYMES</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Soporte continuo y formación</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Adaptación a nuevas tecnologías</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center group cursor-pointer">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl p-6 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                  <IconComponent className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-slate-100 mb-2">
                    {counters[index]}
                    {stat.suffix || "+"}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Values */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-slate-100 mb-12">Nuestros Valores</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeValue === index ? "scale-105" : "hover:scale-102"
                  }`}
                  onClick={() => setActiveValue(index)}
                >
                  <div
                    className={`bg-gradient-to-br from-slate-800 to-slate-900 border rounded-2xl p-8 h-full transition-all duration-300 ${
                      activeValue === index
                        ? "border-blue-500/50 shadow-lg shadow-blue-500/25"
                        : "border-slate-700 hover:border-blue-500/30"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
                        activeValue === index
                          ? "bg-gradient-to-br from-blue-600 to-purple-600"
                          : "bg-gradient-to-br from-slate-700 to-slate-600"
                      }`}
                    >
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-100 mb-4">{value.title}</h4>
                    <p className="text-slate-300 leading-relaxed font-light">{value.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">¿Listo para transformar tu empresa?</h3>
            <p className="text-slate-400 mb-6 font-light">
              Únete a las empresas que ya aprovechan el poder de la IA y automatización.
            </p>
            <button
              onClick={handleEmpezarClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-white"
            >
              Empezar Ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
