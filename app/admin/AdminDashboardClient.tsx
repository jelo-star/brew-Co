'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Settings, Coffee, Image as ImageIcon, MessageSquare, HelpCircle, 
  Plus, Edit, Trash2, Save, Upload, LogOut, CheckCircle, AlertTriangle
} from 'lucide-react'

// Supabase Storage Image Upload (Moved outside component for render-loop purity)
async function uploadImage(file: File, folder: string) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Upload to 'brew-and-co' bucket
  const { error: uploadError } = await supabase.storage
    .from('brew-and-co')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  // Get public URL
  const { data } = supabase.storage.from('brew-and-co').getPublicUrl(filePath)
  return data.publicUrl
}

interface SettingItem {
  key: string
  value: Record<string, unknown>
}

interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
}

interface MenuItem {
  id: string
  category_id: string
  name: string
  description?: string
  price: number | string
  image_url?: string
  is_featured: boolean
  categories?: {
    name: string
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

interface HeroSettings {
  title?: string
  subtitle?: string
  cta_primary?: string
  cta_secondary?: string
}

interface AboutSettings {
  content?: string
}

interface ContactSettings {
  address?: string
  phone?: string
  email?: string
  facebook?: string
  instagram?: string
  hours_json?: {
    monday_friday?: string
    saturday_sunday?: string
  }
}

interface SeoSettings {
  title?: string
  description?: string
  keywords?: string
}

interface AdminDashboardClientProps {
  initialSettings: SettingItem[]
  initialCategories: Category[]
  initialMenuItems: MenuItem[]
  initialGallery: GalleryItem[]
  initialTestimonials: Testimonial[]
  initialFaqs: Faq[]
}

export default function AdminDashboardClient({
  initialSettings,
  initialCategories,
  initialMenuItems,
  initialGallery,
  initialTestimonials,
  initialFaqs
}: AdminDashboardClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'settings' | 'menu' | 'gallery' | 'testimonials' | 'faqs'>('settings')
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // Data States
  const [categories] = useState<Category[]>(initialCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initialGallery)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials)
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs)

  // Parse Site Settings
  const getSettingValue = (key: string) => {
    return initialSettings.find(s => s.key === key)?.value || {}
  }
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(getSettingValue('hero') as HeroSettings)
  const [aboutSettings, setAboutSettings] = useState<AboutSettings>(getSettingValue('about') as AboutSettings)
  const [contactSettings, setContactSettings] = useState<ContactSettings>(getSettingValue('contact') as ContactSettings)
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(getSettingValue('seo') as SeoSettings)

  // Menu Form State
  const [menuForm, setMenuForm] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    category_id: categories[0]?.id || '',
    is_featured: false,
    image_url: ''
  })
  const [isEditingMenu, setIsEditingMenu] = useState(false)
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)

  // Gallery Form State
  const [galleryForm, setGalleryForm] = useState({ title: '', image_url: '' })
  const [galleryFile, setGalleryFile] = useState<File | null>(null)

  // Testimonial Form State
  const [testimonialForm, setTestimonialForm] = useState({ name: '', review: '', rating: 5, photo_url: '' })
  const [testimonialFile, setTestimonialFile] = useState<File | null>(null)

  // FAQ Form State
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' })

  // Trigger temporary status banner
  const triggerStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 1. Save Text Settings
  const saveSettings = async (key: string, value: unknown) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value })

    if (error) {
      triggerStatus(`Failed to save settings: ${error.message}`, 'error')
    } else {
      triggerStatus('Settings updated successfully!', 'success')
      router.refresh()
    }
  }

  // 2. Add / Edit Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let finalImageUrl = menuForm.image_url

      if (menuImageFile) {
        finalImageUrl = await uploadImage(menuImageFile, 'menu')
      }

      const payload = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price),
        category_id: menuForm.category_id,
        is_featured: menuForm.is_featured,
        image_url: finalImageUrl
      }

      if (isEditingMenu) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', menuForm.id)

        if (error) throw error
        triggerStatus('Menu item updated successfully!', 'success')
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([payload])

        if (error) throw error
        triggerStatus('Menu item added successfully!', 'success')
      }

      // Reset form
      setMenuForm({ id: '', name: '', description: '', price: '', category_id: categories[0]?.id || '', is_featured: false, image_url: '' })
      setMenuImageFile(null)
      setIsEditingMenu(false)
      
      // Refresh items list
      const { data } = await supabase.from('menu_items').select('*, categories(*)').order('name')
      if (data) setMenuItems(data)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred saving the menu item'
      triggerStatus(msg, 'error')
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) {
      triggerStatus(error.message, 'error')
    } else {
      triggerStatus('Menu item deleted!', 'success')
      setMenuItems(menuItems.filter(item => item.id !== id))
      router.refresh()
    }
  }

  // 3. Gallery Operations
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let finalImageUrl = galleryForm.image_url
      if (galleryFile) {
        finalImageUrl = await uploadImage(galleryFile, 'gallery')
      }

      if (!finalImageUrl) throw new Error('Please select an image file or provide a URL')

      const { error } = await supabase
        .from('gallery_items')
        .insert([{ title: galleryForm.title, image_url: finalImageUrl }])

      if (error) throw error
      triggerStatus('Gallery image added!', 'success')
      setGalleryForm({ title: '', image_url: '' })
      setGalleryFile(null)

      const { data } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false })
      if (data) setGalleryItems(data)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred adding the image'
      triggerStatus(msg, 'error')
    }
  }

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this image?')) return
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) {
      triggerStatus(error.message, 'error')
    } else {
      triggerStatus('Gallery image removed!', 'success')
      setGalleryItems(galleryItems.filter(item => item.id !== id))
      router.refresh()
    }
  }

  // 4. Testimonial Operations
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let finalPhotoUrl = testimonialForm.photo_url
      if (testimonialFile) {
        finalPhotoUrl = await uploadImage(testimonialFile, 'testimonials')
      }

      const { error } = await supabase
        .from('testimonials')
        .insert([{
          name: testimonialForm.name,
          review: testimonialForm.review,
          rating: testimonialForm.rating,
          photo_url: finalPhotoUrl
        }])

      if (error) throw error
      triggerStatus('Testimonial added successfully!', 'success')
      setTestimonialForm({ name: '', review: '', rating: 5, photo_url: '' })
      setTestimonialFile(null)

      const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      if (data) setTestimonials(data)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred saving the review'
      triggerStatus(msg, 'error')
    }
  }

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Delete review?')) return
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) {
      triggerStatus(error.message, 'error')
    } else {
      triggerStatus('Review deleted!', 'success')
      setTestimonials(testimonials.filter(item => item.id !== id))
      router.refresh()
    }
  }

  // 5. FAQ Operations
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('faqs').insert([faqForm])
    if (error) {
      triggerStatus(error.message, 'error')
    } else {
      triggerStatus('FAQ added!', 'success')
      setFaqForm({ question: '', answer: '' })
      const { data } = await supabase.from('faqs').select('*').order('sort_order')
      if (data) setFaqs(data)
      router.refresh()
    }
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete FAQ?')) return
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) {
      triggerStatus(error.message, 'error')
    } else {
      triggerStatus('FAQ deleted!', 'success')
      setFaqs(faqs.filter(f => f.id !== id))
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '40px' }}>
          <Coffee style={{ color: 'var(--accent-gold)' }} />
          BREW & CO Admin
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textTransform: 'none' }}
          >
            <Settings size={18} />
            Site Settings
          </button>
          
          <button 
            onClick={() => setActiveTab('menu')}
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textTransform: 'none' }}
          >
            <Coffee size={18} />
            Menu Manager
          </button>

          <button 
            onClick={() => setActiveTab('gallery')}
            className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textTransform: 'none' }}
          >
            <ImageIcon size={18} />
            Gallery Manager
          </button>

          <button 
            onClick={() => setActiveTab('testimonials')}
            className={`btn ${activeTab === 'testimonials' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textTransform: 'none' }}
          >
            <MessageSquare size={18} />
            Testimonials
          </button>

          <button 
            onClick={() => setActiveTab('faqs')}
            className={`btn ${activeTab === 'faqs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', gap: '12px', width: '100%', textTransform: 'none' }}
          >
            <HelpCircle size={18} />
            FAQs List
          </button>
        </nav>

        <button onClick={handleLogout} className="btn btn-secondary" style={{ gap: '12px', width: '100%', textTransform: 'none', color: 'var(--error)', borderColor: 'var(--error)' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Form Content panel */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        
        {/* Floating status alert banner */}
        {statusMessage && (
          <div style={{ 
            position: 'absolute', 
            top: '40px', 
            right: '40px', 
            background: statusMessage.type === 'success' ? 'rgba(96, 108, 56, 0.9)' : 'rgba(183, 9, 76, 0.9)', 
            border: '1px solid',
            borderColor: statusMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
            borderRadius: '8px', 
            padding: '12px 24px', 
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {statusMessage.text}
          </div>
        )}

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {/* TAB 1: Site Settings */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Site Configuration</h2>
              
              {/* Hero Setup */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Hero Headline Settings
                  <button onClick={() => saveSettings('hero', heroSettings)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Save size={14} /> Save
                  </button>
                </h3>
                <div className="form-group">
                  <label className="form-label">Hero Title</label>
                  <input type="text" className="form-input" value={heroSettings.title || ''} onChange={(e) => setHeroSettings({...heroSettings, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hero Subtitle</label>
                  <textarea className="form-input" rows={2} value={heroSettings.subtitle || ''} onChange={(e) => setHeroSettings({...heroSettings, subtitle: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Primary CTA Text</label>
                    <input type="text" className="form-input" value={heroSettings.cta_primary || ''} onChange={(e) => setHeroSettings({...heroSettings, cta_primary: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secondary CTA Text</label>
                    <input type="text" className="form-input" value={heroSettings.cta_secondary || ''} onChange={(e) => setHeroSettings({...heroSettings, cta_secondary: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* About Content */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  About Us Copy
                  <button onClick={() => saveSettings('about', aboutSettings)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Save size={14} /> Save
                  </button>
                </h3>
                <div className="form-group">
                  <label className="form-label">Description Text</label>
                  <textarea className="form-input" rows={4} value={aboutSettings.content || ''} onChange={(e) => setAboutSettings({...aboutSettings, content: e.target.value})} />
                </div>
              </div>

              {/* Contact Information */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Contact & Hours Information
                  <button onClick={() => saveSettings('contact', contactSettings)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Save size={14} /> Save
                  </button>
                </h3>
                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input type="text" className="form-input" value={contactSettings.address || ''} onChange={(e) => setContactSettings({...contactSettings, address: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" value={contactSettings.phone || ''} onChange={(e) => setContactSettings({...contactSettings, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={contactSettings.email || ''} onChange={(e) => setContactSettings({...contactSettings, email: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Monday - Friday Hours</label>
                    <input type="text" className="form-input" value={contactSettings.hours_json?.monday_friday || ''} onChange={(e) => setContactSettings({...contactSettings, hours_json: {...contactSettings.hours_json, monday_friday: e.target.value}})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Saturday - Sunday Hours</label>
                    <input type="text" className="form-input" value={contactSettings.hours_json?.saturday_sunday || ''} onChange={(e) => setContactSettings({...contactSettings, hours_json: {...contactSettings.hours_json, saturday_sunday: e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* SEO Configurations */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  SEO Settings
                  <button onClick={() => saveSettings('seo', seoSettings)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Save size={14} /> Save
                  </button>
                </h3>
                <div className="form-group">
                  <label className="form-label">Meta Title</label>
                  <input type="text" className="form-input" value={seoSettings.title || ''} onChange={(e) => setSeoSettings({...seoSettings, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Description</label>
                  <textarea className="form-input" rows={2} value={seoSettings.description || ''} onChange={(e) => setSeoSettings({...seoSettings, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Keywords (comma separated)</label>
                  <input type="text" className="form-input" value={seoSettings.keywords || ''} onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Menu Items CRUD */}
          {activeTab === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Menu Item Catalog</h2>
              
              {/* Form panel for Add/Edit */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>
                  {isEditingMenu ? 'Edit Drink/Pastry' : 'Add New Drink/Pastry'}
                </h3>
                
                <form onSubmit={handleSaveMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Item Name</label>
                      <input type="text" required className="form-input" placeholder="e.g. Spanish Latte" value={menuForm.name} onChange={(e) => setMenuForm({...menuForm, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (₱)</label>
                      <input type="number" required step="0.01" className="form-input" placeholder="140.00" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm, price: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} placeholder="Ingredients, taste profiles, etc." value={menuForm.description} onChange={(e) => setMenuForm({...menuForm, description: e.target.value})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-input" value={menuForm.category_id} onChange={(e) => setMenuForm({...menuForm, category_id: e.target.value})}>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                      <input type="checkbox" id="is_featured" checked={menuForm.is_featured} onChange={(e) => setMenuForm({...menuForm, is_featured: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor="is_featured" className="form-label" style={{ cursor: 'pointer' }}>Show in Featured List</label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Image File Upload</label>
                      <input type="file" accept="image/*" className="form-input" onChange={(e) => setMenuImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Image URL (Optional fallback)</label>
                      <input type="text" className="form-input" placeholder="https://..." value={menuForm.image_url} onChange={(e) => setMenuForm({...menuForm, image_url: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {isEditingMenu ? 'Update Item' : 'Add Item'}
                    </button>
                    {isEditingMenu && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingMenu(false)
                          setMenuForm({ id: '', name: '', description: '', price: '', category_id: categories[0]?.id || '', is_featured: false, image_url: '' })
                        }} 
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Data Table */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>All Menu Items</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '12px' }}>Name</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Price</th>
                        <th style={{ padding: '12px' }}>Featured</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{item.categories?.name}</td>
                          <td style={{ padding: '12px', color: 'var(--accent-gold)' }}>₱{Number(item.price).toFixed(2)}</td>
                          <td style={{ padding: '12px' }}>{item.is_featured ? '⭐ Yes' : 'No'}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => {
                                setIsEditingMenu(true)
                                setMenuForm({
                                  id: item.id,
                                  name: item.name,
                                  description: item.description || '',
                                  price: item.price.toString(),
                                  category_id: item.category_id,
                                  is_featured: item.is_featured,
                                  image_url: item.image_url || ''
                                })
                              }}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: '6px' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteMenuItem(item.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Gallery CRUD */}
          {activeTab === 'gallery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Gallery Manager</h2>
              
              {/* Form */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Upload Image</h3>
                <form onSubmit={handleAddGalleryItem} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Image Label</label>
                    <input type="text" className="form-input" placeholder="e.g. Pour Over Brewing" value={galleryForm.title} onChange={(e) => setGalleryForm({...galleryForm, title: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Select File</label>
                      <input type="file" accept="image/*" className="form-input" onChange={(e) => setGalleryFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Or Image URL</label>
                      <input type="text" className="form-input" placeholder="https://..." value={galleryForm.image_url} onChange={(e) => setGalleryForm({...galleryForm, image_url: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <Upload size={16} /> Upload Photo
                  </button>
                </form>
              </div>

              {/* Grid of existing gallery items */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {galleryItems.map((item) => (
                  <div key={item.id} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '150px', borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '12px' }}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {item.title || 'Untitled'}
                      </span>
                      <button onClick={() => handleDeleteGallery(item.id)} className="btn btn-secondary" style={{ padding: '6px', borderColor: 'var(--error)', color: 'var(--error)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Testimonials CRUD */}
          {activeTab === 'testimonials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Customer Testimonials</h2>
              
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Add Review</h3>
                <form onSubmit={handleSaveTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Client Name</label>
                      <input type="text" required className="form-input" placeholder="e.g. Ramon Valenzuela" value={testimonialForm.name} onChange={(e) => setTestimonialForm({...testimonialForm, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rating Rating</label>
                      <select className="form-input" value={testimonialForm.rating} onChange={(e) => setTestimonialForm({...testimonialForm, rating: parseInt(e.target.value)})}>
                        <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                        <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                        <option value="3">⭐⭐⭐ (3 Stars)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Review Text</label>
                    <textarea required className="form-input" rows={3} placeholder="The Spanish Latte is divine..." value={testimonialForm.review} onChange={(e) => setTestimonialForm({...testimonialForm, review: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Photo Upload</label>
                      <input type="file" accept="image/*" className="form-input" onChange={(e) => setTestimonialFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Photo URL</label>
                      <input type="text" className="form-input" placeholder="https://..." value={testimonialForm.photo_url} onChange={(e) => setTestimonialForm({...testimonialForm, photo_url: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">Save Testimonial</button>
                </form>
              </div>

              {/* Table List */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Current Reviews</h3>
                {testimonials.map((test) => (
                  <div key={test.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '16px 0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {test.photo_url && <img src={test.photo_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{test.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{test.review}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTestimonial(test.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAQs CRUD */}
          {activeTab === 'faqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>Frequently Asked Questions</h2>
              
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Add FAQ</h3>
                <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Question</label>
                    <input type="text" required className="form-input" placeholder="e.g. Do you offer delivery?" value={faqForm.question} onChange={(e) => setFaqForm({...faqForm, question: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Answer</label>
                    <textarea required className="form-input" rows={3} placeholder="Yes, we partner with local delivery services..." value={faqForm.answer} onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary">Save FAQ</button>
                </form>
              </div>

              {/* List */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Current FAQs</h3>
                {faqs.map((faq) => (
                  <div key={faq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '16px 0' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{faq.question}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{faq.answer}</p>
                    </div>
                    <button onClick={() => handleDeleteFaq(faq.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
