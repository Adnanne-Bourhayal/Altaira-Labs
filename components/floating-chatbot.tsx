"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Brain } from "lucide-react"

type Message = {
  id: number
  text: string
  isBot: boolean
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy el asistente virtual de Altaira Labs. ¿En qué puedo ayudarte hoy?", isBot: true },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
    }

    setMessages([...messages, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponses = [
        "Gracias por tu mensaje. ¿En qué más puedo ayudarte?",
        "Entiendo lo que necesitas. ¿Te gustaría programar una consulta con nuestros expertos?",
        "Esa es una excelente pregunta. Nuestras soluciones de IA pueden ayudarte con ese desafío.",
        "Puedo proporcionarte más información sobre nuestros servicios de IA. ¿Hay algo específico que te interese?",
      ]

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

      const botMessage: Message = {
        id: messages.length + 2,
        text: randomResponse,
        isBot: true,
      }

      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      <div
        className={cn(
          "bg-white dark:bg-slate-900 rounded-lg shadow-xl w-80 md:w-96 transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-10 pointer-events-none",
        )}
      >
        {/* Chat header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white p-1 rounded-full mr-2">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-white font-medium">Asistente Altaira</h3>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleChat}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat messages */}
        <div className="p-4 h-80 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "mb-4 max-w-[80%] p-3 rounded-lg",
                message.isBot
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  : "bg-blue-500 text-white ml-auto rounded-tr-none",
              )}
            >
              {message.text}
            </div>
          ))}

          {isTyping && (
            <div className="mb-4 max-w-[80%] p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 flex">
          <Input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1 mr-2"
          />
          <Button type="submit" size="icon" className="bg-blue-500 hover:bg-blue-600">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Chat button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "rounded-full w-14 h-14 shadow-lg transition-all duration-300",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600",
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  )
}

