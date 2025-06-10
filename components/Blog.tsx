"use client"

import { useState } from "react"
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react"

const blogPosts = [
  {
    title: "5 Formas en que la IA Puede Revolucionar tu Pequeña Empresa en 2025",
    excerpt:
      "Descubre las aplicaciones más prácticas de la Inteligencia Artificial para PYMES y cómo implementarlas sin grandes inversiones.",
    category: "Inteligencia Artificial",
    date: "15 Enero 2025",
    readTime: "5 min",
    featured: true,
  },
  {
    title: "Automatización de Procesos: Guía Completa para Principiantes",
    excerpt:
      "Todo lo que necesitas saber sobre automatización empresarial, desde conceptos básicos hasta implementación práctica.",
    category: "Automatización",
    date: "12 Enero 2025",
    readTime: "8 min",
    featured: false,
  },
  {
    title: "ROI de la Transformación Digital: Casos Reales de PYMES Españolas",
    excerpt:
      "Análisis detallado del retorno de inversión en proyectos de digitalización con ejemplos reales y métricas concretas.",
    category: "Casos de Estudio",
    date: "10 Enero 2025",
    readTime: "6 min",
    featured: false,
  },
  {
    title: "Chatbots Inteligentes: Cómo Mejorar la Atención al Cliente 24/7",
    excerpt:
      "Implementa un chatbot que realmente ayude a tus clientes y mejore la experiencia de usuario en tu negocio.",
    category: "Tecnología",
    date: "8 Enero 2025",
    readTime: "7 min",
    featured: false,
  },
  {
    title: "Análisis de Datos para PYMES: De Números a Decisiones Inteligentes",
    excerpt:
      "Aprende a convertir los datos de tu empresa en insights accionables que impulsen el crecimiento de tu negocio.",
    category: "Análisis de Datos",
    date: "5 Enero 2025",
    readTime: "9 min",
    featured: false,
  },
  {
    title: "Tendencias Tecnológicas 2025: Lo Que Toda PYME Debe Saber",
    excerpt:
      "Las tecnologías emergentes que marcarán el año y cómo tu empresa puede aprovecharlas para mantenerse competitiva.",
    category: "Tendencias",
    date: "3 Enero 2025",
    readTime: "10 min",
    featured: false,
  },
]

const categories = [
  "Todos",
  "Inteligencia Artificial",
  "Automatización",
  "Casos de Estudio",
  "Tecnología",
  "Análisis de Datos",
  "Tendencias",
]

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [hoveredPost, setHoveredPost] = useState<number | null>(null)

  const filteredPosts =
    selectedCategory === "Todos" ? blogPosts : blogPosts.filter((post) => post.category === selectedCategory)

  return (
    <section id="blog" className="py-20 bg-gradient-to-b from-white to-slate-100">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-800">
            Blog &{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Recursos</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
            Mantente al día con las últimas tendencias en IA y automatización
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {selectedCategory === "Todos" && (
          <div className="mb-16">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 font-semibold text-sm">Destacado</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">{blogPosts[0].title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6 font-light">{blogPosts[0].excerpt}</p>
                  <div className="flex items-center space-x-6 text-slate-500 text-sm mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{blogPosts[0].date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{blogPosts[0].readTime} lectura</span>
                    </div>
                  </div>
                  <button className="group flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors w-fit">
                    <span className="font-semibold">Leer artículo completo</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
                  <div className="w-full h-64 lg:h-full bg-white rounded-2xl flex items-center justify-center shadow-inner border border-slate-100">
                    <div className="text-center text-slate-600">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <Tag className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-lg font-semibold">Artículo Destacado</div>
                      <div className="text-sm">Contenido Premium</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(selectedCategory === "Todos" ? 1 : 0).map((post, index) => (
            <article
              key={index}
              className="group cursor-pointer transition-all duration-300 transform hover:scale-105"
              onMouseEnter={() => setHoveredPost(index)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              <div
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  hoveredPost === index
                    ? "border-blue-200 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-blue-200"
                } shadow-md`}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                  <div className="w-full h-full bg-white flex items-center justify-center border-b border-slate-100">
                    <div className="text-center text-slate-600">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-md">
                        <Tag className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm font-semibold">Imagen del Artículo</div>
                    </div>
                  </div>
                  {/* Category badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 font-light">{post.excerpt}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-8 backdrop-blur-sm text-center shadow-lg">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">¿Quieres recibir nuestros últimos artículos?</h3>
            <p className="text-slate-600 mb-6 font-light">
              Suscríbete a nuestro newsletter y mantente al día con las últimas tendencias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-full text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/20">
                Suscribirse
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
