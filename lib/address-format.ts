// Spanish connectors stay lowercase mid-string (e.g. "Ciudad de Buenos Aires").
const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'a', 'en']);

/**
 * Georef returns ALL-CAPS nomenclaturas ("AVENIDA CORRIENTES 1234, ..."); make
 * them read naturally as Title Case. Tokens containing digits (house numbers,
 * postal codes like C1264AAN) are left untouched so they aren't mangled.
 *
 * Pure string util kept free of env imports so it's unit-testable.
 */
export function prettyLabel(raw: string): string {
  let wordIndex = 0;
  return raw
    .split(/([,\s]+)/)
    .map((token) => {
      if (token === '' || /^[,\s]+$/.test(token)) return token; // separators
      const i = wordIndex++;
      if (/\d/.test(token)) return token.toUpperCase();
      const lower = token.toLowerCase();
      if (i > 0 && CONNECTORS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}
