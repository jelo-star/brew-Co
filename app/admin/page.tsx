import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/config'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!getSupabaseConfig().isConfigured) {
    redirect('/login?error=Add%20Supabase%20credentials%20to%20.env.local%20before%20opening%20the%20admin%20dashboard.')
  }

  const supabase = await createClient()

  // 1. Authenticate check: redirect to login if session does not exist
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/admin')
  }

  // 2. Fetch all datasets from Supabase tables
  const { data: settings } = await supabase.from('site_settings').select('*')
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
  const { data: menuItems } = await supabase.from('menu_items').select('*, categories(*)').order('name')
  const { data: gallery } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false })
  const { data: testimonials } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
  const { data: faqs } = await supabase.from('faqs').select('*').order('sort_order')

  return (
    <AdminDashboardClient
      initialSettings={settings || []}
      initialCategories={categories || []}
      initialMenuItems={menuItems || []}
      initialGallery={gallery || []}
      initialTestimonials={testimonials || []}
      initialFaqs={faqs || []}
    />
  )
}
