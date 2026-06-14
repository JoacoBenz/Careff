// Spanish connectors stay lowercase mid-string (e.g. "Ciudad de Buenos Aires").
const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'a', 'en']);

// House numbers (all digits) and Argentine postal codes (CPA, e.g. C1264AAN, or
// the legacy 4-digit form) are kept verbatim/upper-cased rather than mangled.
const HOUSE_NUMBER = /^\d+$/;
const POSTAL_CODE = /^[A-Za-z]\d{4}[A-Za-z]{3}$/;

/**
 * Georef returns ALL-CAPS nomenclaturas ("AVENIDA CORRIENTES 1234, ..."); make
 * them read naturally as Title Case. House numbers and postal codes are left as
 * upper-case so they aren't mangled, while other digit-bearing tokens (e.g.
 * "Km8", "Ruta2") are title-cased like any other word.
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
      if (HOUSE_NUMBER.test(token) || POSTAL_CODE.test(token)) return token.toUpperCase();
      const lower = token.toLowerCase();
      if (i > 0 && CONNECTORS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}
