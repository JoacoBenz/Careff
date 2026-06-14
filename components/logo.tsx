/**
 * Careff brand lockup. The "C" is a custom glyph — the first letter of the
 * wordmark, drawn in the Bexovar "B" style (white stem, amber angular arms,
 * white terminal dot; JoacoBenz/Bexovar-website assets/favicon.svg) but with
 * no tile, so it flows straight into "areff" and reads as one word "Careff".
 * The small "by Bexovar" credit is set in Inter, the Bexovar brand font.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex items-baseline">
        {/* tight viewBox cropped to the glyph so it sizes like a letter; the
            svg bottom aligns to the text baseline (replaced-element baseline) */}
        <svg viewBox="10 8 25 30" className="h-[18px] w-auto" aria-hidden>
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
        <span
          className="text-xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          areff
        </span>
      </span>
      <span
        className="text-[10px] tracking-[0.08em] text-slate-400"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        by <span className="font-semibold text-slate-300">Bexovar</span>
      </span>
    </span>
  );
}
