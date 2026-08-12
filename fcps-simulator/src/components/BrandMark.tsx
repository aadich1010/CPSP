/**
 * BrandMark.tsx
 * -----------------------------------------------------------------------------
 * The caduceus (staff, wings, two coiled snakes) used as the site's brand
 * logo -- original vector artwork, not traced from any stock/licensed image.
 * Single-color so it works as a plain fill on top of the existing gradient
 * badge squares (navbar, footer, dashboard sidebar) -- pass `color` to match
 * whatever background it sits on (defaults to white, for the emerald/teal
 * gradient boxes used everywhere it currently appears).
 */
export default function BrandMark({
  size = 24,
  color = 'white',
  className,
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 32.0 C58.7 22.5, 68.6 24.5, 74.8 30.6 C67.4 33.6, 58.7 34.4, 50 35.8 Z" fill={color} />
      <path d="M50 32.0 C41.3 22.5, 31.4 24.5, 25.2 30.6 C32.6 33.6, 41.3 34.4, 50 35.8 Z" fill={color} />
      <line x1="50" y1="29.0" x2="50" y2="83.2" stroke={color} strokeWidth="3.6" strokeLinecap="round" />
      <path
        d="M50.0 40.8 L51.2 41.7 L53.0 42.6 L54.9 43.5 L56.7 44.4 L58.2 45.3 L59.1 46.2 L59.4 47.1 L59.0 48.0 L57.9 48.9 L56.2 49.8 L54.0 50.7 L51.4 51.6 L48.6 52.5 L45.8 53.4 L43.1 54.3 L40.9 55.2 L39.2 56.1 L38.3 57.0 L38.0 57.9 L38.6 58.8 L39.9 59.7 L41.8 60.6 L44.3 61.5 L47.1 62.4 L50.0 63.3 L52.9 64.2 L55.5 65.1 L57.6 66.0 L59.2 66.9 L60.1 67.8 L60.3 68.7 L59.8 69.6 L58.7 70.5 L57.0 71.4 L55.0 72.3 L52.9 73.2 L50.9 74.1 L49.2 75.0 L48.2 75.9 L50.0 76.8"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M50.0 40.8 L48.8 41.7 L47.0 42.6 L45.1 43.5 L43.3 44.4 L41.8 45.3 L40.9 46.2 L40.6 47.1 L41.0 48.0 L42.1 48.9 L43.8 49.8 L46.0 50.7 L48.6 51.6 L51.4 52.5 L54.2 53.4 L56.9 54.3 L59.1 55.2 L60.8 56.1 L61.7 57.0 L62.0 57.9 L61.4 58.8 L60.1 59.7 L58.2 60.6 L55.7 61.5 L52.9 62.4 L50.0 63.3 L47.1 64.2 L44.5 65.1 L42.4 66.0 L40.8 66.9 L39.9 67.8 L39.7 68.7 L40.2 69.6 L41.3 70.5 L43.0 71.4 L45.0 72.3 L47.1 73.2 L49.1 74.1 L50.8 75.0 L51.8 75.9 L50.0 76.8"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx="50.6" cy="40.8" r="2.4" fill={color} />
      <circle cx="49.4" cy="40.8" r="2.4" fill={color} />
      <circle cx="50" cy="23.2" r="3.6" fill={color} />
    </svg>
  )
}
