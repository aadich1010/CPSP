// Shown automatically by Next.js while a route segment's server component
// is fetching data (see the sibling `loading.tsx` files). Without this,
// the browser shows a blank white screen until every `await` in the page
// and its layout resolves — on a slow mobile connection that can be a
// multi-second freeze, which is exactly wrong for an exam-prep app.
//
// Kept intentionally generic (label + row count) rather than one bespoke
// skeleton per page: the goal is "something is happening" feedback within
// milliseconds, not a pixel-perfect placeholder.

interface PageLoadingProps {
  label?: string
  rows?: number
}

export default function PageLoading({ label = 'Loading…', rows = 3 }: PageLoadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        gap: 24,
        padding: 24,
        background: 'var(--color-bg)',
      }}
    >
      <div
        className="spinner"
        style={{ width: 32, height: 32, borderWidth: 3 }}
        role="status"
        aria-label={label}
      />
      <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>{label}</div>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="animate-shimmer"
            style={{
              height: 16,
              borderRadius: 8,
              background: 'var(--color-border)',
              opacity: 0.6,
              width: i === rows - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    </div>
  )
}
