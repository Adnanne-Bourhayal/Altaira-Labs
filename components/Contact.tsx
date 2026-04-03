"use client"

import type React from "react"
import { useState } from "react"
import { Send, MessageCircle, Calendar, CheckCircle, ArrowRight } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: "", business: "", email: "" })
    }, 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I want to grow my business with a website")
    window.open(`https://wa.me/34694908262?text=${message}`, "_blank")
  }

  const handleCalendar = () => {
    window.open("https://calendly.com/altairalabs", "_blank")
  }

  return (
    <section id="contact" className="py-28 bg-[#050810] relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            Get your free proposal
          </h2>
          <p className="text-lg text-white/40">
            Response within 24 hours
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Form */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Sent</h4>
                <p className="text-white/50">We will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">Business</label>
                  <input
                    type="text"
                    name="business"
                    value={formData.business}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                    placeholder="you@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-white disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Get Free Proposal</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <button
              onClick={handleWhatsApp}
              className="w-full group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">WhatsApp</div>
                    <div className="text-white/40 text-sm">Quick response</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={handleCalendar}
              className="w-full group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Schedule a Call</div>
                    <div className="text-white/40 text-sm">15 min free consultation</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h4 className="text-white font-semibold mb-3 text-sm">What you get:</h4>
              <ul className="space-y-2">
                {[
                  "Analysis of your situation",
                  "Custom design proposal",
                  "Detailed quote",
                  "Estimated delivery",
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2.5 text-white/50 text-sm">
                    <div className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="text-center mt-10 text-white/30 text-sm">
          <p>altairalabs@gmail.com | +34 694 908 262</p>
        </div>
      </div>
    </section>
  )
}
