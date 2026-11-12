/**
 * Shared field styling so every form input looks and focuses identically.
 * The visual definition lives in the `.field` primitive (app/globals.css).
 *
 * `fieldBase` has NO width, so per-field width utilities (w-16/w-24) don't
 * collide with w-full (Tailwind resolves conflicts by compiled order, not by
 * class-string order). `inputClass` is the full-width default.
 */
export const fieldBase = 'field';

export const inputClass = `${fieldBase} w-full`;
