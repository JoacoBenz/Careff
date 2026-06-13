/**
 * Careff brand lockup. The product name uses the app's display font; the small
 * "by Bexovar" credit to its right is set in Inter — the Bexovar website's
 * brand font (JoacoBenz/Bexovar-website site.css: --bx-font-sans: 'Inter', ...)
 * — so the attribution visually matches the Bexovar brand.
 */
export function Logo() {
  return (
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
  );
}
