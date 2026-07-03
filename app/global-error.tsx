'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{
        backgroundColor: '#0b0908',
        color: '#fdfbf7',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        margin: 0,
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(20, 17, 15, 0.7)',
          border: '1px solid rgba(197, 160, 89, 0.12)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c5a059',
            marginBottom: '16px',
            display: 'block'
          }}>System Notice</span>
          
          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px' }}>Something went wrong!</h2>
          <p style={{ color: '#a39589', marginBottom: '32px', lineHeight: '1.6' }}>
            An unexpected error occurred in the application layer.
          </p>

          <button
            onClick={() => reset()}
            style={{
              background: '#c5a059',
              color: '#0b0908',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5c178'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#c5a059'}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
