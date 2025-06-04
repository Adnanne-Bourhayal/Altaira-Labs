"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, ArrowRight, CheckCircle, Lightbulb, Zap, Bot, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import GlassmorphismButton from "@/components/glassmorphism-button"
import { cn } from "@/lib/utils"

type Question = {
  id: number
  text: string
  options: {
    id: string
    text: string
    points: Record<string, number>
  }[]
}

type Result = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  recommendation: string
}

const questions: Question[] = [
  {
    id: 1,
    text: "¿Cuál es el principal desafío que enfrenta tu negocio actualmente?",
    options: [
      {
        id: "q1a",
        text: "Necesitamos mejorar la toma de decisiones basada en datos",
        points: { strategy: 3, research: 2, development: 1, automation: 0, operation: 0 },
      },
      {
        id: "q1b",
        text: "Queremos automatizar procesos repetitivos",
        points: { automation: 3, operation: 2, development: 1, strategy: 0, research: 0 },
      },
      {
        id: "q1c",
        text: "Buscamos mejorar la experiencia de nuestros clientes",
        points: { development: 3, strategy: 2, operation: 1, automation: 0, research: 0 },
      },
      {
        id: "q1d",
        text: "Necesitamos innovar en nuestros productos o servicios",
        points: { research: 3, strategy: 2, development: 1, automation: 0, operation: 0 },
      },
    ],
  },
  {
    id: 2,
    text: "¿Qué nivel de madurez digital tiene tu organización?",
    options: [
      {
        id: "q2a",
        text: "Principiante - Estamos comenzando nuestra transformación digital",
        points: { strategy: 3, operation: 2, development: 1, automation: 0, research: 0 },
      },
      {
        id: "q2b",
        text: "Intermedio - Tenemos algunos procesos digitalizados",
        points: { development: 2, automation: 2, operation: 2, strategy: 1, research: 1 },
      },
      {
        id: "q2c",
        text: "Avanzado - Somos una organización digital pero queremos mejorar",
        points: { automation: 3, research: 2, operation: 2, development: 1, strategy: 0 },
      },
      {
        id: "q2d",
        text: "Experto - Somos líderes digitales en nuestro sector",
        points: { research: 3, automation: 2, development: 1, operation: 0, strategy: 0 },
      },
    ],
  },
  {
    id: 3,
    text: "¿Qué recursos tienes disponibles para implementar soluciones de IA?",
    options: [
      {
        id: "q3a",
        text: "Tenemos un equipo técnico con experiencia en IA",
        points: { operation: 3, development: 2, research: 2, automation: 1, strategy: 0 },
      },
      {
        id: "q3b",
        text: "Tenemos datos pero necesitamos ayuda para aprovecharlos",
        points: { strategy: 3, research: 2, development: 1, automation: 0, operation: 0 },
      },
      {
        id: "q3c",
        text: "Tenemos presupuesto pero poca experiencia técnica",
        points: { development: 3, operation: 2, automation: 1, strategy: 1, research: 0 },
      },
      {
        id: "q3d",
        text: "Recursos limitados pero mucho interés en innovar",
        points: { strategy: 3, automation: 2, operation: 1, development: 0, research: 0 },
      },
    ],
  },
  {
    id: 4,
    text: "¿Cuál es tu objetivo principal al implementar IA en tu negocio?",
    options: [
      {
        id: "q4a",
        text: "Reducir costos y aumentar la eficiencia",
        points: { automation: 3, operation: 2, strategy: 1, development: 0, research: 0 },
      },
      {
        id: "q4b",
        text: "Mejorar la experiencia del cliente",
        points: { development: 3, operation: 2, automation: 1, strategy: 1, research: 0 },
      },
      {
        id: "q4c",
        text: "Obtener insights de nuestros datos",
        points: { research: 3, strategy: 2, development: 1, automation: 0, operation: 0 },
      },
      {
        id: "q4d",
        text: "Crear nuevos productos o servicios",
        points: { development: 3, research: 2, strategy: 1, automation: 0, operation: 0 },
      },
    ],
  },
  {
    id: 5,
    text: "¿En qué plazo esperas ver resultados de tu inversión en IA?",
    options: [
      {
        id: "q5a",
        text: "Corto plazo (1-3 meses)",
        points: { automation: 3, operation: 2, development: 1, strategy: 0, research: 0 },
      },
      {
        id: "q5b",
        text: "Mediano plazo (3-6 meses)",
        points: { development: 3, operation: 2, automation: 1, strategy: 1, research: 0 },
      },
      {
        id: "q5c",
        text: "Largo plazo (6-12 meses)",
        points: { strategy: 3, research: 2, development: 1, automation: 0, operation: 0 },
      },
      {
        id: "q5d",
        text: "Estratégico (más de 12 meses)",
        points: { research: 3, strategy: 2, development: 1, automation: 0, operation: 0 },
      },
    ],
  },
]

const results: Result[] = [
  {
    id: "strategy",
    title: "AI Strategy",
    description: "Tu negocio necesita una estrategia de IA bien definida para maximizar el valor de esta tecnología.",
    icon: <Brain className="h-8 w-8 text-blue-500" />,
    recommendation:
      "Recomendamos comenzar con nuestra consultoría en IA para definir una hoja de ruta clara que alinee la tecnología con tus objetivos de negocio.",
  },
  {
    id: "development",
    title: "AI Development",
    description:
      "Tu negocio está listo para implementar soluciones de IA personalizadas que resuelvan problemas específicos.",
    icon: <Bot className="h-8 w-8 text-purple-500" />,
    recommendation:
      "Nuestro servicio de desarrollo de IA puede ayudarte a crear chatbots, sistemas de recomendación y otras soluciones a medida.",
  },
  {
    id: "automation",
    title: "AI Automation",
    description: "Tu negocio puede beneficiarse enormemente de la automatización de procesos mediante IA.",
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    recommendation:
      "Nuestras soluciones de automatización pueden ayudarte a reducir costos y liberar a tu equipo de tareas repetitivas.",
  },
  {
    id: "operation",
    title: "AI Operation",
    description:
      "Tu negocio necesita optimizar y mantener las soluciones de IA existentes para maximizar su rendimiento.",
    icon: <Lightbulb className="h-8 w-8 text-green-500" />,
    recommendation:
      "Nuestro servicio de operación de IA puede ayudarte a mantener, optimizar y escalar tus soluciones actuales.",
  },
  {
    id: "research",
    title: "AI Research & Insights",
    description:
      "Tu negocio puede beneficiarse de la investigación avanzada en IA para descubrir nuevas oportunidades.",
    icon: <BarChart className="h-8 w-8 text-red-500" />,
    recommendation:
      "Nuestro equipo de investigación puede ayudarte a explorar nuevas tecnologías y tendencias en IA para mantener tu ventaja competitiva.",
  },
]

export default function AIQuestionnaire() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleAnswer = (questionId: number, optionId: string) => {
    setIsAnimating(true)

    // Update answers
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))

    // Delay to show animation
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        calculateResult()
      }
      setIsAnimating(false)
    }, 500)
  }

  const calculateResult = () => {
    // Calculate points for each category
    const points: Record<string, number> = {
      strategy: 0,
      development: 0,
      automation: 0,
      operation: 0,
      research: 0,
    }

    // For each question, add points based on the selected option
    Object.entries(answers).forEach(([questionId, optionId]) => {
      const question = questions.find((q) => q.id === Number.parseInt(questionId))
      if (!question) return

      const option = question.options.find((o) => o.id === optionId)
      if (!option) return

      // Add points for each category
      Object.entries(option.points).forEach(([category, value]) => {
        points[category] = (points[category] || 0) + value
      })
    })

    // Find the category with the highest points
    let maxCategory = ""
    let maxPoints = -1

    Object.entries(points).forEach(([category, value]) => {
      if (value > maxPoints) {
        maxCategory = category
        maxPoints = value
      }
    })

    // Set the result
    const matchedResult = results.find((r) => r.id === maxCategory)
    setResult(matchedResult || null)
    setShowResults(true)
  }

  const resetQuestionnaire = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setResult(null)
  }

  const progress = ((currentQuestion + (showResults ? 1 : 0)) / questions.length) * 100

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-4">
            <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Descubre la Solución de IA Ideal para tu Negocio</CardTitle>
          <CardDescription>Responde estas preguntas para recibir una recomendación personalizada</CardDescription>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {showResults ? "Resultados" : `Pregunta ${currentQuestion + 1} de ${questions.length}`}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key={`question-${currentQuestion}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-medium mb-6">{questions[currentQuestion].text}</h3>

                <div className="space-y-4">
                  {questions[currentQuestion].options.map((option) => (
                    <motion.div key={option.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <button
                        className={cn(
                          "w-full text-left p-4 rounded-lg border transition-all duration-200",
                          "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                          answers[questions[currentQuestion].id] === option.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700",
                        )}
                        onClick={() => handleAnswer(questions[currentQuestion].id, option.id)}
                        disabled={isAnimating}
                      >
                        <div className="flex items-start">
                          <div
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex items-center justify-center",
                              answers[questions[currentQuestion].id] === option.id
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300 dark:border-slate-600",
                            )}
                          >
                            {answers[questions[currentQuestion].id] === option.id && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span>{option.text}</span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="mb-6">
                  <div className="mx-auto bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full inline-flex">
                    {result?.icon || <Brain className="h-10 w-10 text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold mt-4 mb-2">Tu solución recomendada: {result?.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">{result?.description}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    Recomendación personalizada
                  </h4>

                  <p className="text-slate-700 dark:text-slate-300">{result?.recommendation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          {!showResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0 || isAnimating}
              >
                Anterior
              </Button>

              <Button
                onClick={() => {
                  if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion((prev) => prev + 1)
                  } else if (Object.keys(answers).length === questions.length) {
                    calculateResult()
                  }
                }}
                disabled={!answers[questions[currentQuestion]?.id] || isAnimating}
              >
                {currentQuestion < questions.length - 1 ? "Siguiente" : "Ver Resultados"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetQuestionnaire}>
                Reiniciar Cuestionario
              </Button>

              <GlassmorphismButton variant="primary" href="/contact" className="group">
                Solicitar Consulta Gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </GlassmorphismButton>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

