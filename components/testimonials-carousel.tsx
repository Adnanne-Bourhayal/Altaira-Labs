"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    id: 1,
    content:
      "Altaira Labs transformó nuestra operación de servicio al cliente con su solución de chatbot. Redujimos los tiempos de respuesta en un 80% y aumentamos la satisfacción del cliente.",
    author: "María Rodríguez",
    position: "Directora de Operaciones",
    company: "TechSolutions Inc.",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    content:
      "La consultoría en IA que recibimos de Altaira Labs nos ayudó a identificar oportunidades que no habíamos considerado. Su enfoque estratégico y conocimiento técnico son excepcionales.",
    author: "Carlos Mendoza",
    position: "CEO",
    company: "Innovatech",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    content:
      "Implementamos la solución de análisis de datos de Altaira Labs y obtuvimos insights que impulsaron un aumento del 25% en nuestras ventas. Su equipo es profesional y altamente capacitado.",
    author: "Laura Sánchez",
    position: "Directora de Marketing",
    company: "Global Retail",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    content:
      "La automatización de procesos implementada por Altaira Labs redujo nuestros costos operativos en un 30%. Su capacidad para entender nuestras necesidades y ofrecer soluciones personalizadas es impresionante.",
    author: "Javier Torres",
    position: "Director Financiero",
    company: "LogisticsPro",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const nextSlide = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  const prevSlide = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))

    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }

  // Auto-play
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const handleMouseLeave = () => {
    intervalRef.current = setInterval(() => {
      nextSlide()
    }, 6000)
  }

  return (
    <div className="relative max-w-4xl mx-auto" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
              <Card className="p-8 md:p-10 relative border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="absolute top-6 right-6 text-blue-500 dark:text-blue-400 opacity-20">
                  <Quote size={48} />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 dark:border-blue-400">
                      <img
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-6 relative z-10">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <h4 className="font-bold text-lg">{testimonial.author}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{testimonial.position}</p>
                      <p className="text-blue-600 dark:text-blue-400">{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8 gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              activeIndex === index
                ? "bg-blue-600 dark:bg-blue-400 w-6"
                : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500",
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-full bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hidden md:flex"
        onClick={prevSlide}
        disabled={isAnimating}
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-full bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hidden md:flex"
        onClick={nextSlide}
        disabled={isAnimating}
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

