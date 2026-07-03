'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
      gestureOrientation: 'vertical',
      anchors: false,
    })

    const handleScrollToSection = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const targetId = customEvent.detail
      const target = document.getElementById(targetId)
      if (!target) return

      lenis.scrollTo(target, {
        offset: -88,
        immediate: false,
        lock: false,
      })
    }

    const onScroll = () => ScrollTrigger.update()
    const raf = (time: number) => lenis.raf(time * 1000)

    lenis.on('scroll', onScroll)
    window.addEventListener('brew:scroll-to-section', handleScrollToSection as EventListener)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      lenis.off('scroll', onScroll)
      lenis.destroy()
      window.removeEventListener('brew:scroll-to-section', handleScrollToSection as EventListener)
      gsap.ticker.remove(raf)
    }
  }, [])

  return <>{children}</>
}
