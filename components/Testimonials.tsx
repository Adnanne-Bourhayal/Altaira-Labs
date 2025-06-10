"use client"

import { useState, useEffect, useRef } from "react"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "María González",
    company: "Restaurante La Paella Digital",
    role: "Propietaria",
    content:
      "Altaira Labs transformó completamente nuestro negocio. El sistema de reservas automatizado y el chatbot para pedidos nos han permitido aumentar nuestros ingresos un 40% en solo 3 meses.",
    rating: 5,
  },
  {
    name: "Dr. Carlos Ruiz",
    company: "Clínica Dental Sonrisa",
    role: "Director Médico",
    content:
      "La automatización de recordatorios y el CRM personalizado nos ha ahorrado 15 horas semanales de trabajo administrativo. Ahora podemos dedicar más tiempo a nuestros pacientes.",
    rating: 5,
  },
  {
    name: "Ana Martín",
    company: "ModaStyle Online",
    role: "Fundadora",
    content:
      "Nunca pensé que mi pequeña tienda pudiera competir con las grandes. El chatbot inteligente y la automatización de inventario han duplicado nuestras ventas online.",
    rating: 5,
  },
  {
    name: "Roberto Silva",
    company: "Consultoría Legal Silva",
    role: "Socio Director",
    content:
      "El análisis de datos que implementaron nos ayuda a tomar decisiones más informadas. Hemos optimizado nuestros procesos y mejorado la satisfacción de nuestros clientes.",
    rating: 5,
  },
  {
    name: "Laura Fernández",
    company: "Academia de Idiomas Global",
    role: "Directora",
    content:
      "La plataforma de gestión de estudiantes y las automatizaciones han revolucionado nuestra academia. Ahora podemos manejar el triple de estudiantes con el mismo equipo.",
    rating: 5,
  },
]

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [ratingCounts, setRatingCounts] = useState(testimonials.map(() => 0))
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)

          testimonials.forEach((testimonial, index) => {
            const countTo = testimonial.rating
            const duration = 1500 // ms
            const startTime = Date.now()

            const timer = setInterval(() => {
              const now = Date.now()
              const progress = Math.min((now - startTime) / duration, 1)

              setRatingCounts((prev) => {
                const newCounts = [...prev]
                newCounts[index] = Math.floor(progress * countTo)
                return newCounts
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

    if (testimonialsRef.current) {
      observer.observe(testimonialsRef.current)
    }

    return () => {
      if (testimonialsRef.current) {
        observer.unobserve(testimonialsRef.current)
      }
    }
  }, [hasAnimated])

  return (
    <section className="py-20 bg-gradient-to-b from-slate-100 to-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-800">
            Lo Que Dicen{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nuestros Clientes
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
            La satisfacción de nuestros clientes es nuestra mayor recompensa
          </p>
        </div>

        {/* Main Testimonial */}
        <div ref={testimonialsRef} className="max-w-4xl mx-auto mb-16">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-blue-100 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              {/* Quote icon */}
              <Quote className="w-12 h-12 text-blue-600 mb-6" />

              {/* Content */}
              <blockquote className="text-xl md:text-2xl text-slate-700 leading-relaxed mb-8 font-light">
                "{testimonials[currentTestimonial].content}"
              </blockquote>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < ratingCounts[currentTestimonial] ? "text-yellow-400 fill-current" : "text-slate-300"}`}
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {testimonials[currentTestimonial].name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <div className="text-slate-800 font-semibold text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-blue-600 font-medium">{testimonials[currentTestimonial].role}</div>
                  <div className="text-slate-500 text-sm">{testimonials[currentTestimonial].company}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Navigation */}
        <div className="flex justify-center space-x-3 mb-16">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentTestimonial === index ? "bg-blue-600 scale-125" : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* All Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white border rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                currentTestimonial === index
                  ? "border-blue-200 shadow-lg shadow-blue-100 scale-105"
                  : "border-slate-200 hover:border-blue-200 shadow-md"
              }`}
              onClick={() => setCurrentTestimonial(index)}
            >
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < ratingCounts[index] ? "text-yellow-400 fill-current" : "text-slate-300"}`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 font-light">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <div className="text-slate-800 font-medium text-sm">{testimonial.name}</div>
                  <div className="text-slate-500 text-xs">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-8 backdrop-blur-sm shadow-lg">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              ¿Quieres ser nuestro próximo testimonio de éxito?
            </h3>
            <p className="text-slate-600 mb-6 font-light">
              Únete a las empresas que ya han transformado su negocio con nuestras soluciones.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/20">
              Empezar Mi Transformación
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
