/**
 * Careff brand lockup: a "C" mark + the "Careff" wordmark + a small
 * "by Bexovar" credit.
 *
 * The "C" is drawn as a stylistic sibling of the Bexovar "B" mark
 * (JoacoBenz/Bexovar-website assets/favicon.svg): same navy rounded tile,
 * white left stem, white terminal dot, same 3px miter strokes — but the two
 * arms open to the right to form a C, in Careff's amber instead of Bexovar's
 * sky-blue. The "by Bexovar" credit is set in Inter, the Bexovar brand font
 * (site.css: --bx-font-sans: 'Inter', ...).
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="48" height="48" rx="9" fill="#0D1B2A" />
        <rect x="13" y="11" width="3" height="26" fill="#FFFFFF" />
        <path
          d="M16 11 L27 11 L33 17.5"
          stroke="#FBBF24"
          strokeWidth="3"
          strokeLinejoin="miter"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M16 37 L27 37 L33 30.5"
          stroke="#FBBF24"
          strokeWidth="3"
          strokeLinejoin="miter"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="14.5" cy="11" r="2.8" fill="#FFFFFF" />
      </svg>
      <span className="flex items-baseline gap-1.5">
        <span
          className="text-lg font-semibold tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Careff
        </span>
        <span
          className="text-[10px] tracking-[0.08em] text-slate-400"
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          by <span className="font-semibold text-slate-300">Bexovar</span>
        </span>
      </span>
    </span>
  );
}
