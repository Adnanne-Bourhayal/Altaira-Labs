"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Phone, MapPin, Send, MessageCircle, Calendar, CheckCircle } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular envío del formulario
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)

    // Reset form after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        service: "",
        message: "",
      })
    }, 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hola! Me interesa conocer más sobre los servicios de Altaira Labs. ¿Podríamos agendar una consulta?",
    )
    window.open(`https://wa.me/34900123456?text=${message}`, "_blank")
  }

  const handleVideollamadaClick = () => {
    // Simular apertura de calendario (en producción sería Calendly o similar)
    window.open("https://calendly.com/altairalabs", "_blank")
  }

  return (
    <section id="contacto" className="py-20 bg-slate-950 relative">
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
            Hablemos de{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Tu Proyecto
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Agenda una consulta gratuita y descubre cómo transformar tu empresa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-slate-100 mb-6">Consulta Gratuita</h3>

            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-slate-100 mb-2">¡Mensaje Enviado!</h4>
                <p className="text-slate-300">Te contactaremos en las próximas 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                      placeholder="tu@empresa.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Empresa</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Servicio</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    >
                      <option value="">Selecciona un servicio</option>
                      <option value="consultoria-ia">Consultoría en IA</option>
                      <option value="automatizacion">Automatización</option>
                      <option value="desarrollo-web">Desarrollo Web</option>
                      <option value="analisis-datos">Análisis de Datos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Cuéntanos sobre tu proyecto *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-50"
                    placeholder="Describe tu proyecto y objetivos..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Consulta</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & Quick Actions */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-slate-100 mb-6">Información de Contacto</h3>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Email</div>
                    <div className="text-slate-100 font-semibold">contacto@altairalabs.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Teléfono</div>
                    <div className="text-slate-100 font-semibold">+34 900 123 456</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Ubicación</div>
                    <div className="text-slate-100 font-semibold">España | Bélgica | Marruecos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-slate-100 mb-6">Contacto Rápido</h3>

              <div className="space-y-4">
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 text-white transform hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp Business</span>
                </button>

                <button
                  onClick={handleVideollamadaClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 text-white transform hover:scale-105"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Agendar Videollamada</span>
                </button>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-bold text-slate-100 mb-3">Tiempo de Respuesta</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-blue-400 font-semibold">&lt; 24 horas</span>
                </div>
                <div className="flex justify-between">
                  <span>WhatsApp:</span>
                  <span className="text-green-400 font-semibold">&lt; 2 horas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
