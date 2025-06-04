"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const projects = [
  {
    id: 1,
    title: "Sistema de Recomendación para E-commerce",
    category: "AI Development",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Implementación de un sistema de recomendación personalizado que aumentó las ventas cruzadas en un 35%.",
  },
  {
    id: 2,
    title: "Automatización de Procesos Financieros",
    category: "AI Automation",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Automatización de procesos de conciliación financiera que redujo el tiempo de procesamiento en un 80%.",
  },
  {
    id: 3,
    title: "Chatbot para Atención al Cliente",
    category: "AI Development",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Desarrollo de un chatbot inteligente que maneja el 70% de las consultas de clientes sin intervención humana.",
  },
  {
    id: 4,
    title: "Análisis Predictivo de Mantenimiento",
    category: "AI Research",
    image: "/placeholder.svg?height=400&width=600",
    description: "Sistema de mantenimiento predictivo que redujo los tiempos de inactividad en un 45%.",
  },
]

export default function ProjectsGrid() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl"
          onMouseEnter={() => setHoveredId(project.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="relative overflow-hidden aspect-video">
            <img
              src={project.image || "/placeholder.svg"}
              alt={project.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-700",
                hoveredId === project.id ? "scale-110" : "scale-100",
              )}
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 transition-opacity duration-300",
                hoveredId === project.id ? "opacity-100" : "opacity-90",
              )}
            >
              <div
                className={cn(
                  "transform transition-transform duration-300",
                  hoveredId === project.id ? "translate-y-0" : "translate-y-4",
                )}
              >
                <span className="text-xs font-semibold text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full mb-2 inline-block">
                  {project.category}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <p
                  className={cn(
                    "text-white/80 text-sm transition-all duration-300 line-clamp-2",
                    hoveredId === project.id ? "opacity-100 max-h-20" : "opacity-0 max-h-0",
                  )}
                >
                  {project.description}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

