/**
 * Careff brand lockup: the official Bexovar mark (from
 * JoacoBenz/Bexovar-website, assets/favicon.svg — navy tile, white stem,
 * sky-blue figure-8 "B") next to the Careff wordmark.
 */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden>
        <rect width="48" height="48" rx="9" fill="#0D1B2A" />
        <rect x="13" y="11" width="3" height="26" fill="#FFFFFF" />
        <path
          d="M16 11 L27 11 L33 17.5 L27 24 L16 24"
          stroke="#38BDF8"
          strokeWidth="3"
          strokeLinejoin="miter"
          fill="none"
        />
        <path
          d="M16 24 L28 24 L34 30.5 L28 37 L16 37"
          stroke="#38BDF8"
          strokeWidth="3"
          strokeLinejoin="miter"
          fill="none"
        />
        <circle cx="14.5" cy="11" r="2.8" fill="#FFFFFF" />
      </svg>
      {withWordmark && (
        <span
          className="text-lg font-[600] tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Careff
        </span>
      )}
    </span>
  );
}
