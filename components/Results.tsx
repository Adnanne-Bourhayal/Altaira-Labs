"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, Users, Clock, Star } from "lucide-react"

const stats = [
  { icon: TrendingUp, value: 40, suffix: "%", label: "More bookings", prefix: "+" },
  { icon: Clock, value: 15, suffix: "h", label: "Saved weekly", prefix: "" },
  { icon: Users, value: 50, suffix: "+", label: "Businesses helped", prefix: "" },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    business: "Style Studio",
    text: "Bookings increased by 45% since launching our new website.",
    avatar: "SJ",
  },
  {
    name: "Marc De Vries",
    business: "AutoPlus",
    text: "No more missed calls. The system handles inquiries 24/7.",
    avatar: "MD",
  },
]

function AnimatedCounter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-white">
      {prefix}{Math.floor(count)}{suffix}
    </div>
  )
}

export default function Results() {
  return (
    <section className="py-28 bg-[#050810] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mb-24 max-w-3xl mx-auto">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-blue-400" />
                </div>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
                <div className="text-white/40 mt-2 text-sm">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            What our clients say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex space-x-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-blue-400 text-blue-400" />
                ))}
              </div>

              <p className="text-white/60 mb-5 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{testimonial.name}</div>
                  <div className="text-white/30 text-xs">{testimonial.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
