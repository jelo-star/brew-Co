'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import {
  Coffee,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  ChevronRight,
  X,
  ShieldCheck,
  Menu,
} from 'lucide-react'
import CoffeeScene from './3d/CoffeeScene'

interface Category {
  id: string
  name: string
  slug: string
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number | string
  image_url?: string
  is_featured: boolean
  categories?: {
    name: string
    slug: string
  }
}

interface GalleryItem {
  id: string
  image_url: string
  title?: string
}

interface Testimonial {
  id: string
  name: string
  review: string
  rating: number
  photo_url?: string
}

interface Faq {
  id: string
  question: string
  answer: string
}

interface HomeClientProps {
  settings: {
    hero: { title: string; subtitle: string; cta_primary: string; cta_secondary: string }
    about: { content: string }
    contact: { address: string; phone: string; email: string; facebook: string; instagram: string; hours_json: Record<string, string> }
    seo: { title: string; description: string; keywords: string }
    theme: { primary: string; secondary: string; accent: string; cream: string; gold: string }
  }
  categories: Category[]
  menuItems: MenuItem[]
  galleryItems: GalleryItem[]
  testimonials: Testimonial[]
  faqs: Faq[]
}

const sectionIds = ['home', 'about', 'journey', 'featured', 'bestsellers', 'menu', 'gallery', 'testimonials', 'location', 'contact'] as const

export default function HomeClient({
  settings,
  categories,
  menuItems,
  galleryItems,
  testimonials,
  faqs,
}: HomeClientProps) {
  const cupGroupRef = useRef<THREE.Group>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSection, setActiveSection] = useState<(typeof sectionIds)[number]>('home')
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false)
  const [reservationSuccess, setReservationSuccess] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [resName, setResName] = useState('')
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resGuests, setResGuests] = useState('2')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isCupLoaded, setIsCupLoaded] = useState(false)

  const featuredDrinks = useMemo(() => menuItems.filter((item) => item.is_featured), [menuItems])
  const filteredMenu = useMemo(
    () => menuItems.filter((item) => activeCategory === 'all' || item.categories?.slug === activeCategory),
    [activeCategory, menuItems]
  )

  const scrollToSection = (id: (typeof sectionIds)[number]) => {
    window.dispatchEvent(new CustomEvent('brew:scroll-to-section', { detail: id }))
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isCupLoaded) return

    gsap.registerPlugin(ScrollTrigger)

    const cup = cupGroupRef.current
    if (!cup) return

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const initX = isMobile ? 0 : 0.55
    const initY = isMobile ? 0.95 : 1.05 // Lowered to align better
    const initScale = isMobile ? 0.20 : 0.26 // Slightly smaller

    // Ensure the cup is at its initial transform
    gsap.set(cup.position, { x: initX, y: initY, z: 0.18 })
    gsap.set(cup.rotation, { x: 0.35, y: -0.25, z: -0.15 }) // Tilted forward (+0.20)
    gsap.set(cup.scale, { x: initScale, y: initScale, z: initScale })
    gsap.set('.coffee-scene-container', { opacity: 1, pointerEvents: 'auto' })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#coffee-pin-wrapper',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        pin: '.coffee-scene-container',
        pinSpacing: false, // Ensures no extra padding is added when unpinned
        invalidateOnRefresh: true,
      }
    })

    // Stage 1: Hero to About (move to right position)
    tl.to(cup.position, { duration: 1, x: isMobile ? 0.45 : 0.65, y: 0.90, z: 0.15, ease: 'sine.inOut' }) // Lowered position
      .to(cup.rotation, { duration: 1, x: 0.38, y: 0.25 + Math.PI * 1.5, z: 0.1, ease: 'sine.inOut' }, 0) // Tilted forward (+0.20)
      .to(cup.scale, { duration: 1, x: initScale * 0.95, y: initScale * 0.95, z: initScale * 0.95, ease: 'sine.inOut' }, 0)

    // Stage 1.5: Hold position during About section (keep right, just rotate)
    tl.to(cup.position, { duration: 1, x: isMobile ? 0.45 : 0.65, y: 0.90, z: 0.15, ease: 'none' })
      .to(cup.rotation, { duration: 1, x: 0.38, y: 0.25 + Math.PI * 3.0, z: 0.1, ease: 'none' }, '<') // Tilted forward (+0.20)
      .to(cup.scale, { duration: 1, x: initScale * 0.95, y: initScale * 0.95, z: initScale * 0.95, ease: 'none' }, '<')

    // Stage 2: About to Journey (move left, rotate further, keep slanting)
    tl.to(cup.position, { duration: 1, x: isMobile ? -0.45 : -0.60, y: 0.85, z: 0.15, ease: 'sine.inOut' })
      .to(cup.rotation, { duration: 1, x: 0.45, y: 0.25 + Math.PI * 4.5, z: -0.08, ease: 'sine.inOut' }, '<') // Tilted forward (+0.20)
      .to(cup.scale, { duration: 1, x: initScale * 1.05, y: initScale * 1.05, z: initScale * 1.05, ease: 'sine.inOut' }, '<')

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      tl.kill()
    }
  }, [isCupLoaded])

  // Refresh ScrollTrigger only when page height actually changes (tab/accordion animations complete)
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 350)
    return () => clearTimeout(timer)
  }, [activeCategory, activeFaq])

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (!visible.length) return

        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const current = visible[0]?.target
        if (current instanceof HTMLElement) {
          setActiveSection(current.id as (typeof sectionIds)[number])
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: '-20% 0px -55% 0px',
      }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyScroll = (event: KeyboardEvent) => {
      if (event.key === 'Home') scrollToSection('home')
    }

    window.addEventListener('keydown', handleKeyScroll)
    return () => window.removeEventListener('keydown', handleKeyScroll)
  }, [])

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resName || !resDate || !resTime) return

    setReservationSuccess(true)
    setTimeout(() => {
      setReservationSuccess(false)
      setIsReserveModalOpen(false)
      setResName('')
      setResDate('')
      setResTime('')
    }, 2500)
  }

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'journey', label: 'Journey' },
    { id: 'featured', label: 'Featured' },
    { id: 'bestsellers', label: 'Sellers' },
    { id: 'menu', label: 'Menu' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'location', label: 'Branch' },
    { id: 'contact', label: 'Contact' },
  ] as const

  const journeySteps = [
    ['Selected Beans', 'Sourcing premium beans from specialty farmers in Sorsogon and beyond.'],
    ['Artisanal Roasting', 'Roasting in small batches to lock in caramel sweetness and complexity.'],
    ['Precision Grinding', 'Grinding fresh for every cup to preserve clarity and sweetness.'],
    ['Scientific Brewing', 'Monitoring water, bloom, and brew ratios for consistency.'],
    ['Froth & Serve', 'Serving with pristine crema and detailed latte art.'],
  ]

  return (
    <div id="page-wrapper" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Wrapper to handle pinning for exactly the first three sections */}
      <div id="coffee-pin-wrapper" style={{ position: 'relative', width: '100%' }}>
        <CoffeeScene cupRef={cupGroupRef} onLoad={() => setIsCupLoaded(true)} />

        <header className="premium-header">
          <div className="container header-inner">
            <button type="button" className="logo-text" onClick={() => scrollToSection('home')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
              <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" x2="14" y1="2" y2="2" />
              </svg>
              BREW & CO
            </button>

            <nav className="nav-links">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={() => setIsReserveModalOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                Reserve Table
              </button>
            </nav>
          </div>
        </header>

        {/* Background Decor */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          {/* Leaf Shadows with radial gradient masks to completely remove sharp edges */}
          <img src="https://images.unsplash.com/photo-1616086782352-7809df65cd4b?q=80&w=800" alt="Leaf Shadow" style={{ position: 'absolute', top: -100, left: -100, width: '600px', opacity: 0.12, mixBlendMode: 'multiply', filter: 'blur(3px) contrast(1.5)', transform: 'rotate(-15deg)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 60%)', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 60%)' }} />
          <img src="https://images.unsplash.com/photo-1616086782352-7809df65cd4b?q=80&w=800" alt="Leaf Shadow" style={{ position: 'absolute', bottom: -100, right: -100, width: '600px', opacity: 0.15, mixBlendMode: 'multiply', filter: 'blur(4px) contrast(1.5)', transform: 'rotate(160deg)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 60%)', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 60%)' }} />
        </div>

        <section id="home" className="scroll-section hero-section" style={{ minHeight: '70vh', alignItems: 'flex-start', textAlign: 'left', padding: '110px 0 0 0', position: 'relative' }}>
          <div className="container" style={{ position: 'relative', zIndex: 10, paddingBottom: '120px' }}>
            <div style={{ maxWidth: '600px' }}>
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="hero-tagline">
                Specialty Coffee Guild - Sorsogon
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="hero-title" dangerouslySetInnerHTML={{ __html: settings.hero.title.replace('Inspire', '<span>Inspire</span>') }} />
              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="hero-desc" style={{ margin: '0 0 40px 0' }}>
                {settings.hero.subtitle}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ display: 'flex', gap: '16px' }}>
                <button type="button" onClick={() => scrollToSection('menu')} className="btn btn-primary">
                  {settings.hero.cta_primary}
                </button>
                <button type="button" onClick={() => scrollToSection('contact')} className="btn btn-secondary">
                  {settings.hero.cta_secondary}
                </button>
              </motion.div>
            </div>
          </div>
          
          {/* Wavy Bottom SVG dynamically stretched */}
          <div style={{ position: 'absolute', bottom: -2, left: 0, width: '100%', zIndex: 2, pointerEvents: 'none' }}>
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '12vw', minHeight: '100px' }}>
              <path fill="var(--bg-tertiary)" fillOpacity="1" d="M0,128L60,149.3C120,171,240,213,360,202.7C480,192,600,128,720,128C840,128,960,192,1080,213.3C1200,235,1320,213,1380,202.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
              <path fill="var(--accent-gold)" fillOpacity="0.25" d="M0,256L80,240C160,224,320,192,480,186.7C640,181,800,203,960,218.7C1120,235,1280,245,1360,250.7L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
            </svg>
          </div>
        </section>

        <section id="about" className="scroll-section" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '30px', paddingBottom: '30px' }}>
            <div style={{ maxWidth: '540px', textAlign: 'left' }}>
              <span className="hero-tagline">Our Heritage</span>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--accent-gold)' }}>Crafted in Sorsogon</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '24px', textShadow: '0 2px 10px rgba(253, 248, 240, 0.8)' }}>
                {settings.about.content}
              </p>
              <button type="button" onClick={() => scrollToSection('journey')} className="btn btn-secondary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                Our Coffee Journey <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section id="journey" className="scroll-section" style={{ background: 'transparent' }}>
          <div className="container" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div style={{ maxWidth: '620px', textAlign: 'left', padding: '20px 0' }}>
              <span className="hero-tagline">Behind the Cup</span>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--accent-gold)' }}>The Bean to Cup Process</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {journeySteps.map(([title, desc], idx) => (
                  <div key={title} style={{ display: 'flex', gap: '18px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(197, 160, 89, 0.08)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-gold)', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</h4>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.55' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="featured" className="scroll-section" style={{ background: 'transparent' }}>
        <div className="container" style={{ width: '100%', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-tagline">Signature Selections</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>Featured Beverages</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', position: 'relative', zIndex: 20 }}>
            {featuredDrinks.map((drink) => (
              <motion.div key={drink.id} whileHover={{ y: -2 }} className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000' }}>
                  {drink.image_url ? (
                    <img src={drink.image_url} alt={drink.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Coffee size={40} style={{ color: 'var(--accent-gold)', opacity: 0.5 }} />
                    </div>
                  )}
                </div>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{drink.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '20px', flex: 1 }}>{drink.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>₱{Number(drink.price).toFixed(2)}</span>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Signature</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="bestsellers" className="scroll-section" style={{ background: 'transparent' }}>
        <div className="container" style={{ width: '100%', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-tagline">Loved by Sorsogon</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>Our Best Sellers</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', position: 'relative', zIndex: 20 }}>
            {/* Best Seller Item 1 */}
            <motion.div whileHover={{ y: -2 }} className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000' }}>
                <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600" alt="Spanish Latte" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Spanish Latte</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '20px', flex: 1 }}>Our signature sweetened, creamy espresso latte with a warm cinnamon dust.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>₱140.00</span>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffb703' }}>Best Seller</span>
              </div>
            </motion.div>
            
            {/* Best Seller Item 2 */}
            <motion.div whileHover={{ y: -2 }} className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000' }}>
                <img src="https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=600" alt="Iced Caramel Macchiato" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Iced Caramel Macchiato</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '20px', flex: 1 }}>Layered espresso, vanilla syrup, fresh cold milk, and rich caramel drizzle.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>₱145.00</span>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffb703' }}>Popular</span>
              </div>
            </motion.div>

            {/* Best Seller Item 3 */}
            <motion.div whileHover={{ y: -2 }} className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000' }}>
                <img src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600" alt="Cold Brew Cream" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Cold Brew Cream</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '20px', flex: 1 }}>16-hour slow steeped cold brew topped with premium vanilla sweet cream cold foam.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>₱135.00</span>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffb703' }}>Highly Rated</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="menu" className="scroll-section" style={{ background: 'transparent' }}>
        <div className="container" style={{ padding: '80px 24px', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
            <div>
              <span className="hero-tagline">The Taste Guild</span>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>Brew Menu</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button onClick={() => setActiveCategory('all')} className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                All Menu
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} className={`btn ${activeCategory === cat.slug ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ minHeight: '300px' }}>
            <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', position: 'relative', zIndex: 20 }}>
              <AnimatePresence mode="popLayout">
                {filteredMenu.map((item) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} className="glass-card" style={{ display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: item.image_url ? '#000' : 'rgba(197, 160, 89, 0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Coffee size={24} style={{ color: 'var(--accent-gold)', opacity: 0.5 }} />}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>₱{Number(item.price).toFixed(2)}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4', marginTop: '6px' }}>{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="gallery" className="story-section" style={{ background: 'transparent', borderTop: '1px solid var(--glass-border)' }}>
        <div className="story-marker" />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-tagline">Visual Sensation</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>Our Cafe Gallery</h2>
          </div>
          <div style={{ columnCount: 3, columnGap: '24px', position: 'relative', zIndex: 20 }}>
            {galleryItems.map((item) => (
              <div key={item.id} className="glass-card" style={{ breakInside: 'avoid', marginBottom: '24px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflow: 'hidden', borderRadius: '8px', position: 'relative' }}>
                  <motion.img whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }} src={item.image_url} alt={item.title || 'Brew & Co Gallery'} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', cursor: 'zoom-in' }} />
                </div>
                {item.title && <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'left', fontWeight: 500 }}>{item.title}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="story-section" style={{ background: 'transparent', borderTop: '1px solid var(--glass-border)' }}>
        <div className="story-marker" />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-tagline">What They Say</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>Reviews from the Guild</h2>
          </div>
          <div className="testimonials-container">
            {testimonials.map((test) => (
              <div key={test.id} className="glass-card testimonial-card">
                <div style={{ display: 'flex', gap: '4px', color: 'var(--accent-gold)', marginBottom: '16px' }}>
                  {Array.from({ length: test.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1, marginBottom: '24px', fontStyle: 'italic' }}>
                  &ldquo;{test.review}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {test.photo_url && <img src={test.photo_url} alt={test.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />}
                  <h5 style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{test.name}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section" style={{ background: 'transparent', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-tagline">Have Questions?</span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>FAQs</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 20 }}>
            {faqs.map((faq, idx) => (
              <button
                key={faq.id}
                type="button"
                className="glass-card"
                style={{ padding: '20px 24px', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{faq.question}</h4>
                  <span style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', transform: activeFaq === idx ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </div>
                {activeFaq === idx && <p style={{ color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.55' }}>{faq.answer}</p>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="location" className="scroll-section" style={{ background: 'transparent', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ width: '100%', padding: '80px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            {/* Left side text info */}
            <div style={{ textAlign: 'left', maxWidth: '500px' }}>
              <span className="hero-tagline">Brew & Co Headquarters</span>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--accent-gold)' }}>Sorsogon Branch</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '24px' }}>
                Step into our Sorsogon sanctuary where modern architecture meets the rich, warm heritage of local coffee crafting. Indulge in artisanal batches, enjoy the aroma of fresh roasting beans, and relax in our luxury glasshouse lounge.
              </p>
              
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 600 }}>Branch Highlights</h4>
                <ul style={{ color: 'var(--text-secondary)', listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  <li>In-house small batch micro-roastery.</li>
                  <li>Sip specialty single-origins from local Sorsogon micro-lots.</li>
                  <li>High-speed fiber internet & designated remote-work spaces.</li>
                  <li>Exclusive weekend cupping sessions and barista workshops.</li>
                </ul>
              </div>
            </div>
            
            {/* Right side Visual Card + Small Map */}
            <div className="glass-card" style={{ padding: '24px', position: 'relative', zIndex: 20 }}>
              <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#000', border: '1px solid var(--glass-border)' }}>
                <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=600" alt="Cafe Interior" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>Visit Our Sorsogon Glasshouse</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                Magsaysay St., Sorsogon City, Philippines. Located near the historic city hall and public plaza.
              </p>
              <button onClick={() => scrollToSection('contact')} className="btn btn-secondary" style={{ width: '100%' }}>
                Get Directions & Contact Info
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-section" style={{ background: 'transparent', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{ maxWidth: '620px', textAlign: 'left', padding: '80px 0', position: 'relative', zIndex: 20 }}>
            <span className="hero-tagline">Come Visit Us</span>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--accent-gold)' }}>Location & Hours</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><MapPin size={20} style={{ color: 'var(--accent-gold)' }} /><span style={{ color: 'var(--text-secondary)' }}>{settings.contact.address}</span></div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><Phone size={20} style={{ color: 'var(--accent-gold)' }} /><span style={{ color: 'var(--text-secondary)' }}>{settings.contact.phone}</span></div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><Mail size={20} style={{ color: 'var(--accent-gold)' }} /><span style={{ color: 'var(--text-secondary)' }}>{settings.contact.email}</span></div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <Clock size={20} style={{ color: 'var(--accent-gold)', marginTop: '4px' }} />
                <div style={{ color: 'var(--text-secondary)' }}>
                  <div><strong>Mon - Fri:</strong> {settings.contact.hours_json?.monday_friday || '8:00 AM - 10:00 PM'}</div>
                  <div><strong>Sat - Sun:</strong> {settings.contact.hours_json?.saturday_sunday || '9:00 AM - 11:00 PM'}</div>
                </div>
              </div>
            </div>
            <div style={{ height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#000', marginBottom: '32px', position: 'relative' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15542.421714571933!2d124.0041228!3d12.9647228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a151be67c4e5cf%3A0xe54d66f44d9f67a2!2sSorsogon%20City%20Hall!5e0!3m2!1sen!2sph!4v1719600000000!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0, opacity: 0.72 }}
                loading="lazy"
              />
            </div>
            <button onClick={() => setIsReserveModalOpen(true)} className="btn btn-primary" style={{ width: '100%' }}>
              Book Table Reservation
            </button>
          </div>
        </div>
      </section>

      <footer className="premium-footer" style={{ position: 'relative', zIndex: 20 }}>
        <div className="container footer-inner">
          <div>
            <div className="logo-text" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>BREW & CO</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Specialty Coffee Roasters from Sorsogon City, Philippines.</div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href={settings.contact.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '10px' }}>
              <Menu size={18} />
            </a>
            <a href={settings.contact.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '10px' }}>
              <Menu size={18} />
            </a>
          </div>
          <div className="copyright">&copy; {new Date().getFullYear()} BREW & CO. Powered by Next.js & Supabase.</div>
        </div>
      </footer>

      <AnimatePresence>
        {isReserveModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="glass-card" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
              <button onClick={() => setIsReserveModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              {reservationSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ display: 'inline-flex', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(96, 108, 56, 0.2)', border: '1px solid var(--success)', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', marginBottom: '20px' }}>
                    <ShieldCheck size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Reservation Booked!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>We have successfully saved your table booking. See you at Brew & Co!</p>
                </div>
              ) : (
                <form onSubmit={handleReservation}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--accent-gold)' }}>Book a Table</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="resName">Full Name</label>
                    <input id="resName" type="text" required className="form-input" placeholder="Your name" value={resName} onChange={(e) => setResName(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="resDate">Date</label>
                      <input id="resDate" type="date" required className="form-input" value={resDate} onChange={(e) => setResDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="resTime">Time</label>
                      <input id="resTime" type="time" required className="form-input" value={resTime} onChange={(e) => setResTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="resGuests">Number of Guests</label>
                    <select id="resGuests" className="form-input" value={resGuests} onChange={(e) => setResGuests(e.target.value)}>
                      <option value="1">1 Person</option>
                      <option value="2">2 Persons</option>
                      <option value="4">4 Persons</option>
                      <option value="6">6 Persons</option>
                      <option value="8">8+ Persons</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>Confirm Booking</button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToSection('home')}
            className="btn btn-primary"
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              zIndex: 99,
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
            aria-label="Back to top"
          >
            <ChevronRight size={24} style={{ transform: 'rotate(-90deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
