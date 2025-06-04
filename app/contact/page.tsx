"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowLeft, MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import PredictiveContactForm from "@/components/predictive-contact-form"
import GlassmorphismButton from "@/components/glassmorphism-button"
import { cn } from "@/lib/utils"

export default function ContactPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <motion.section
        ref={containerRef}
        style={{ opacity, scale }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 py-20 md:py-28 relative overflow-hidden"
      >
        {/* Background particles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contacta con Nosotros</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Estamos aquí para ayudarte a transformar tu negocio con soluciones de IA innovadoras
            </p>
            <GlassmorphismButton variant="outline" href="/" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Volver al Inicio
            </GlassmorphismButton>
          </div>
        </div>
      </motion.section>

      {/* Contact Information */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <ContactCard
              icon={<MapPin className="h-6 w-6 text-blue-500" />}
              title="Dirección"
              details={["Calle Innovación 123", "28001 Madrid, España"]}
              delay={0}
            />

            <ContactCard
              icon={<Phone className="h-6 w-6 text-blue-500" />}
              title="Teléfono"
              details={["+34 91 123 45 67", "+34 600 123 456"]}
              delay={0.1}
            />

            <ContactCard
              icon={<Mail className="h-6 w-6 text-blue-500" />}
              title="Email"
              details={["info@altairalabs.com", "soporte@altairalabs.com"]}
              delay={0.2}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6">Envíanos un Mensaje</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Completa el formulario a continuación y nos pondremos en contacto contigo lo antes posible. Todos los
                campos marcados con * son obligatorios.
              </p>

              <PredictiveContactForm />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:sticky lg:top-32"
            >
              <h2 className="text-3xl font-bold mb-6">Horario de Atención</h2>
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <div className="flex items-start mb-4">
                  <Clock className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">Horario de Oficina</h3>
                    <p className="text-slate-600 dark:text-slate-400">Lunes a Viernes: 9:00 - 18:00</p>
                    <p className="text-slate-600 dark:text-slate-400">Sábado y Domingo: Cerrado</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">Soporte Técnico</h3>
                    <p className="text-slate-600 dark:text-slate-400">Lunes a Viernes: 8:00 - 20:00</p>
                    <p className="text-slate-600 dark:text-slate-400">Sábado: 9:00 - 14:00</p>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-6">Síguenos</h2>
              <div className="flex space-x-4">
                <SocialButton icon="linkedin" href="#" />
                <SocialButton icon="twitter" href="#" />
                <SocialButton icon="facebook" href="#" />
                <SocialButton icon="instagram" href="#" />
              </div>

              <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">¿Prefieres una llamada?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Programa una llamada con uno de nuestros expertos en IA para discutir tus necesidades específicas.
                </p>
                <GlassmorphismButton variant="primary" href="#" className="w-full group">
                  Agendar Llamada
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </GlassmorphismButton>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Encuéntranos</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Visita nuestras oficinas en el corazón de Madrid, donde nuestro equipo de expertos en IA te espera para
              ayudarte a transformar tu negocio.
            </p>
          </div>

          <div className="rounded-lg overflow-hidden shadow-lg h-96 bg-slate-200 dark:bg-slate-700">
            {/* Placeholder for map - in a real implementation, you would use Google Maps or similar */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-slate-600 dark:text-slate-400">Mapa interactivo</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ContactCard({
  icon,
  title,
  details,
  delay,
}: {
  icon: React.ReactNode
  title: string
  details: string[]
  delay: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card className="border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300 h-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <div className="space-y-1">
              {details.map((detail, index) => (
                <p key={index} className="text-slate-600 dark:text-slate-400">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SocialButton({ icon, href }: { icon: string; href: string }) {
  const getIcon = () => {
    switch (icon) {
      case "linkedin":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        )
      case "twitter":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
          </svg>
        )
      case "facebook":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </svg>
        )
      case "instagram":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
        "hover:bg-blue-500 hover:text-white",
      )}
    >
      {getIcon()}
    </a>
  )
}

