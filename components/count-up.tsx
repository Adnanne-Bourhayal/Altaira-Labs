"use client"

import { useState, useEffect, useRef } from "react"
import { useInView } from "@/hooks/use-in-view"

interface CountUpProps {
  start?: number
  end: number
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function CountUp({
  start = 0,
  end,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [count, setCount] = useState(start)
  const countRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(countRef, { once: true, threshold: 0.3 })
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      let startTimestamp: number | null = null
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1)
        const currentCount = progress * (end - start) + start

        setCount(currentCount)

        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          setHasAnimated(true)
        }
      }

      // Add delay before starting animation
      setTimeout(() => {
        window.requestAnimationFrame(step)
      }, delay * 1000)
    }
  }, [start, end, duration, delay, isInView, hasAnimated])

  return (
    <span ref={countRef}>
      {prefix}
      {count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  )
}

