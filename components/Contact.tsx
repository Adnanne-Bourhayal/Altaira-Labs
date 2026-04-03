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
    <section id="contact" className="py-24 bg-[#0A0A0A] relative">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Get your free proposal
          </h2>
          <p className="text-lg text-white/50">
            No commitment. Response within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Form */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Message Sent</h4>
                <p className="text-white/60">We will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Business</label>
                  <input
                    type="text"
                    name="business"
                    value={formData.business}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="you@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-white disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
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
          <div className="space-y-5">
            <button
              onClick={handleWhatsApp}
              className="w-full group bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">WhatsApp</div>
                    <div className="text-white/50 text-sm">Quick response within 2 hours</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={handleCalendar}
              className="w-full group bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Schedule a Call</div>
                    <div className="text-white/50 text-sm">15 min free consultation</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-4">What you get:</h4>
              <ul className="space-y-3">
                {[
                  "Analysis of your current situation",
                  "Custom design proposal",
                  "Detailed quote with no surprises",
                  "Estimated delivery time",
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3 text-white/60 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>altairalabs@gmail.com | +34 694 908 262</p>
        </div>
      </div>
    </section>
  )
}
