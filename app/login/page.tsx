import { login, signup, logout } from './actions'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  error?: string
  message?: string
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { error, message } = await searchParams
  const supabaseConfig = getSupabaseConfig()
  const supabase = supabaseConfig.isConfigured ? await createClient() : null
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } }

  return (
    <>
      <header className="premium-header">
        <div className="container header-inner">
          <Link href="/" className="logo-text">
            <svg
              className="logo-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" x2="14" y1="2" y2="2" />
            </svg>
            BREW & CO
          </Link>
          <nav className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/login" className="nav-link active">Account</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          <div className="glass-card">
            {user ? (
              /* Signed In state */
              <div style={{ textAlign: 'center' }}>
                <span className="hero-tagline" style={{ display: 'block', marginBottom: '8px' }}>Welcome back</span>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '24px' }}>Your Account</h2>
                
                <div style={{ 
                  background: 'rgba(197, 160, 89, 0.05)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '8px', 
                  padding: '16px',
                  marginBottom: '32px',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                </div>

                <form action={logout}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              /* Signed Out state (Login/Signup form) */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span className="hero-tagline" style={{ display: 'block', marginBottom: '8px' }}>Join the Guild</span>
                  <h2 style={{ fontSize: '1.75rem' }}>Sign In or Register</h2>
                </div>

                {error && (
                  <div style={{ 
                    background: 'rgba(183, 9, 76, 0.1)', 
                    border: '1px solid var(--error)', 
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    color: 'var(--text-primary)', 
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                {message && (
                  <div style={{ 
                    background: 'rgba(96, 108, 56, 0.15)', 
                    border: '1px solid var(--success)', 
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    color: 'var(--text-primary)', 
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    ✨ {message}
                  </div>
                )}

                {!supabaseConfig.isConfigured && (
                  <div style={{
                    background: 'rgba(197, 160, 89, 0.1)',
                    border: '1px solid var(--accent-gold)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    marginBottom: '20px',
                    lineHeight: 1.5
                  }}>
                    Supabase is not configured yet. Add your project URL and anon key to <code>.env.local</code>, then restart the dev server.
                  </div>
                )}

                <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="you@example.com" 
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      placeholder="••••••••" 
                      className="form-input" 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <button 
                      formAction={login} 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={!supabaseConfig.isConfigured}
                      style={{ width: '100%', opacity: supabaseConfig.isConfigured ? 1 : 0.55, cursor: supabaseConfig.isConfigured ? 'pointer' : 'not-allowed' }}
                    >
                      Sign In
                    </button>
                    
                    <button 
                      formAction={signup} 
                      type="submit" 
                      className="btn btn-secondary" 
                      disabled={!supabaseConfig.isConfigured}
                      style={{ width: '100%', opacity: supabaseConfig.isConfigured ? 1 : 0.55, cursor: supabaseConfig.isConfigured ? 'pointer' : 'not-allowed' }}
                    >
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="premium-footer">
        <div className="container footer-inner">
          <div className="logo-text" style={{ fontSize: '1.2rem' }}>
            BREW & CO
          </div>
          <div className="copyright">
            &copy; {new Date().getFullYear()} BREW & CO. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
