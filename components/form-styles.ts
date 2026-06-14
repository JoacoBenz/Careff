/**
 * Shared field styling so every form input looks and focuses identically.
 *
 * `fieldBase` has NO width, so per-field width utilities (w-16/w-24) don't
 * collide with w-full (Tailwind resolves conflicts by compiled order, not by
 * class-string order). `inputClass` is the full-width default.
 */
export const fieldBase =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export const inputClass = `${fieldBase} w-full`;
