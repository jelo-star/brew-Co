import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/config'
import HomeClient from '@/components/HomeClient'
import SmoothScroll from '@/components/SmoothScroll'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabaseConfig = getSupabaseConfig()
  const supabase = supabaseConfig.isConfigured ? await createClient() : null

  // Default CMS Content Fallbacks
  const siteSettings = {
    hero: {
      title: "Brewed to Inspire.",
      subtitle: "Every cup tells a story of craftsmanship, passion, and unforgettable flavor.",
      cta_primary: "Explore Menu",
      cta_secondary: "Visit Our Café"
    },
    about: {
      content: "Brew & Co is a specialty coffee shop in Sorsogon dedicated to crafting exceptional coffee experiences. Every cup is prepared with passion, premium ingredients, and attention to detail. Whether you're catching up with friends, working remotely, or simply relaxing, Brew & Co offers a warm and modern café experience."
    },
    contact: {
      address: "Magsaysay St., Sorsogon City, Philippines",
      phone: "+63 912 345 6789",
      email: "hello@brewandco.com",
      facebook: "https://facebook.com/brewandco.sorsogon",
      instagram: "https://instagram.com/brewandco.sorsogon",
      hours_json: {
        monday_friday: "8:00 AM - 10:00 PM",
        saturday_sunday: "9:00 AM - 11:00 PM"
      }
    },
    seo: {
      title: "Brew & Co | Premium Specialty Coffee Shop in Sorsogon",
      description: "Immersive 3D specialty coffee experience in Sorsogon City, Philippines. Taste our craft and join the community.",
      keywords: "coffee, specialty coffee, sorsogon, philippines, brew and co, cafe"
    },
    theme: {
      primary: "#1B1B1B",
      secondary: "#4E342E",
      accent: "#C58B47",
      cream: "#F7F1E8",
      gold: "#D6A756"
    }
  }

  // Placeholder Fallback lists
  let categories = [
    { id: '1', name: 'Coffee', slug: 'coffee' },
    { id: '2', name: 'Non Coffee', slug: 'non-coffee' },
    { id: '3', name: 'Tea', slug: 'tea' },
    { id: '4', name: 'Pastries', slug: 'pastries' }
  ]

  let menuItems = [
    { id: '1', name: 'Spanish Latte', description: 'Espresso mixed with sweetened condensed milk and froth.', price: 140.00, is_featured: true, categories: { slug: 'coffee', name: 'Coffee' } },
    { id: '2', name: 'Iced Americano', description: 'Crisp double espresso poured over cold water and ice.', price: 110.00, is_featured: true, categories: { slug: 'coffee', name: 'Coffee' } },
    { id: '3', name: 'Matcha Latte', description: 'Steamed milk with high-grade ceremonial Japanese matcha.', price: 150.00, is_featured: true, categories: { slug: 'non-coffee', name: 'Non Coffee' } },
    { id: '4', name: 'Signature Brew', description: 'House blend pour-over featuring local Sorsogon beans.', price: 160.00, is_featured: true, categories: { slug: 'coffee', name: 'Coffee' } }
  ]

  let galleryItems = [
    { id: '1', image_url: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600', title: 'Barista Crafting Coffee' },
    { id: '2', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600', title: 'Espresso Pull' },
    { id: '3', image_url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=600', title: 'Cozy Interior Corner' }
  ]

  let testimonials = [
    { id: '1', name: 'Ramon Valenzuela', review: 'The Spanish Latte is divine! Best specialty coffee shop in Sorsogon.', rating: 5, photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' },
    { id: '2', name: 'Sarah Benson', review: 'A great place to work remotely. Very fast internet and the coffee is excellent!', rating: 5, photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150' }
  ]

  let faqs = [
    { id: '1', question: 'Where is Brew & Co located?', answer: 'We are located at Magsaysay St., Sorsogon City, Philippines (right near the city center).' },
    { id: '2', question: 'Do you offer delivery?', answer: 'Yes, we partner with local delivery services in Sorsogon. You can also order directly via phone.' }
  ]

  let isDatabaseConnected = false
  let errorMessage = ''

  if (supabase) {
    try {
      // 1. Fetch site settings
      const { data: dbSettings, error: errSettings } = await supabase.from('site_settings').select('*')
      if (dbSettings && !errSettings && dbSettings.length > 0) {
        dbSettings.forEach((row) => {
          if (row.key in siteSettings) {
            (siteSettings as Record<string, unknown>)[row.key] = row.value
          }
        })
        isDatabaseConnected = true
      }

      // 2. Fetch categories
      const { data: dbCategories, error: errCategories } = await supabase.from('categories').select('*').order('sort_order')
      if (dbCategories && !errCategories && dbCategories.length > 0) {
        categories = dbCategories
      }

      // 3. Fetch menu items
      const { data: dbMenuItems, error: errMenu } = await supabase.from('menu_items').select('*, categories(*)').order('name')
      if (dbMenuItems && !errMenu && dbMenuItems.length > 0) {
        menuItems = dbMenuItems
      }

      // 4. Fetch gallery items
      const { data: dbGallery, error: errGallery } = await supabase.from('gallery_items').select('*').order('sort_order')
      if (dbGallery && !errGallery && dbGallery.length > 0) {
        galleryItems = dbGallery
      }

      // 5. Fetch testimonials
      const { data: dbTestimonials, error: errTestimonials } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      if (dbTestimonials && !errTestimonials && dbTestimonials.length > 0) {
        testimonials = dbTestimonials
      }

      // 6. Fetch FAQs
      const { data: dbFaqs, error: errFaqs } = await supabase.from('faqs').select('*').order('sort_order')
      if (dbFaqs && !errFaqs && dbFaqs.length > 0) {
        faqs = dbFaqs
      }
    } catch (e) {
      isDatabaseConnected = false
      errorMessage = e instanceof Error ? e.message : 'Database query connection error'
    }
  }

  return (
    <SmoothScroll>
      {/* Dynamic database config banner */}
      {!isDatabaseConnected && (
        <div style={{ 
          background: 'linear-gradient(90deg, #D6A756 0%, #C58B47 100%)', 
          color: '#0b0908', 
          textAlign: 'center', 
          padding: '8px 16px', 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          position: 'sticky', 
          top: 0, 
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>
            {supabaseConfig.isConfigured
              ? 'Database unavailable: Showing local brand templates.'
              : 'Add Supabase credentials in .env.local: Showing local brand templates.'}
          </span>
          <Link href="/login" style={{ textDecoration: 'underline', color: '#0b0908' }}>
            Admin login
          </Link>
          {errorMessage && <span>({errorMessage})</span>}
        </div>
      )}

      {/* Main website body */}
      <HomeClient
        settings={siteSettings}
        categories={categories}
        menuItems={menuItems}
        galleryItems={galleryItems}
        testimonials={testimonials}
        faqs={faqs}
      />
    </SmoothScroll>
  )
}
