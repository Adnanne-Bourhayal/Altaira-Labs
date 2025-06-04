"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import GlassmorphismButton from "@/components/glassmorphism-button"

type FormData = {
  name: string
  email: string
  company: string
  phone: string
  message: string
}

type FormErrors = {
  [K in keyof FormData]?: string
}

// Common business domains for predictive suggestions
const commonDomains = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "empresa.com",
  "compañia.com",
  "negocio.com",
]

// Common business types for predictive suggestions
const commonBusinessTypes = [
  "Tecnología",
  "Finanzas",
  "Salud",
  "Educación",
  "Comercio",
  "Manufactura",
  "Servicios",
  "Consultoría",
  "Marketing",
  "Logística",
]

export default function PredictiveContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionField, setActiveSuggestionField] = useState<keyof FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const formRef = useRef<HTMLFormElement>(null)

  // Timer for limited-time offer
  useEffect(() => {
    // Set initial time (10 minutes)
    setTimeLeft(10 * 60)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case "name":
        return value.trim() === "" ? "El nombre es obligatorio" : ""
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Ingresa un correo electrónico válido" : ""
      case "message":
        return value.trim() === "" ? "El mensaje es obligatorio" : ""
      default:
        return ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Validate field
    const error = validateField(name as keyof FormData, value)
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))

    // Generate suggestions based on input
    generateSuggestions(name as keyof FormData, value)
  }

  const generateSuggestions = (field: keyof FormData, value: string) => {
    if (!value.trim()) {
      setSuggestions([])
      setActiveSuggestionField(null)
      return
    }

    let newSuggestions: string[] = []

    switch (field) {
      case "email":
        // If email contains @ but no domain yet
        if (value.includes("@") && !value.split("@")[1]) {
          newSuggestions = commonDomains.map((domain) => `${value.split("@")[0]}@${domain}`)
        }
        // If typing email username (before @)
        else if (!value.includes("@")) {
          newSuggestions = commonDomains.slice(0, 3).map((domain) => `${value}@${domain}`)
        }
        break

      case "company":
        // Suggest business types as company names
        newSuggestions = commonBusinessTypes
          .filter((type) => type.toLowerCase().startsWith(value.toLowerCase()))
          .slice(0, 3)
        break

      case "message":
        // Suggest common message templates
        if (value.length < 20) {
          newSuggestions = [
            "Me gustaría obtener más información sobre sus servicios de IA.",
            "Estoy interesado en una consulta para mi empresa.",
            "Necesito ayuda con la implementación de soluciones de IA.",
          ]
        }
        break

      default:
        break
    }

    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions.slice(0, 3))
      setActiveSuggestionField(field)
    } else {
      setSuggestions([])
      setActiveSuggestionField(null)
    }
  }

  const applySuggestion = (suggestion: string) => {
    if (activeSuggestionField) {
      setFormData((prev) => ({
        ...prev,
        [activeSuggestionField]: suggestion,
      }))

      // Clear suggestions
      setSuggestions([])
      setActiveSuggestionField(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: FormErrors = {}
    let hasErrors = false
    ;(Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key])
      if (error) {
        newErrors[key] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)

    if (!hasErrors) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false)
        setIsSubmitted(true)

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            company: "",
            phone: "",
            message: "",
          })
          setIsSubmitted(false)
        }, 3000)
      }, 1500)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">¡Oferta por tiempo limitado!</h3>
            <p>Agenda tu consulta gratuita de 30 minutos con nuestros expertos en IA</p>
          </div>
          <div className="flex items-center bg-white/20 px-3 py-2 rounded-lg">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={cn(
                    "transition-all duration-300",
                    errors.name ? "border-red-500 focus:ring-red-300" : "focus:ring-blue-300",
                  )}
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(
                    "transition-all duration-300",
                    errors.email ? "border-red-500 focus:ring-red-300" : "focus:ring-blue-300",
                  )}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

                {/* Email suggestions */}
                {activeSuggestionField === "email" && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="focus:ring-blue-300"
                  placeholder="Nombre de tu empresa"
                />

                {/* Company suggestions */}
                {activeSuggestionField === "company" && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="focus:ring-blue-300"
                  placeholder="+34 123 456 789"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="message">
                Mensaje <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={cn(
                  "min-h-32 transition-all duration-300",
                  errors.message ? "border-red-500 focus:ring-red-300" : "focus:ring-blue-300",
                )}
                placeholder="¿En qué podemos ayudarte?"
              />
              {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}

              {/* Message suggestions */}
              {activeSuggestionField === "message" && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <GlassmorphismButton type="submit" variant="primary" className="group" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Mensaje
                    <Send className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </GlassmorphismButton>
            </div>
          </motion.form>
        ) : (
          <motion.div
            className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="mx-auto bg-green-100 dark:bg-green-800 p-3 rounded-full inline-flex mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">¡Mensaje Enviado!</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

