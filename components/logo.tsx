/**
 * Bexoxvar brand mark + wordmark. Placeholder vector drawn to match the
 * night-flight theme — replace this component's SVG with the real logo asset
 * when available (or drop an <img src="/logo.svg" /> in its place).
 */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <defs>
          <linearGradient id="bx-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#bx-bg)" />
        {/* route through the city: pickups to destination */}
        <path
          d="M7 24 L13 11 L19 18 L25 8"
          fill="none"
          stroke="#1c1003"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="24" r="2.6" fill="#1c1003" />
        <circle cx="25" cy="8" r="3.2" fill="#fff" stroke="#1c1003" strokeWidth="1.8" />
      </svg>
      {withWordmark && (
        <span
          className="font-[600] text-lg tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          bexoxvar
        </span>
      )}
    </span>
  );
}
