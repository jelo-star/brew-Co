export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const hasUrl = Boolean(url && !url.includes('your-project-ref'))
  const hasAnonKey = Boolean(anonKey && !anonKey.includes('your-anon-key'))

  return {
    url,
    anonKey,
    isConfigured: hasUrl && hasAnonKey,
  }
}
