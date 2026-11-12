/**
 * Where to send someone after signing in. Only same-site paths are allowed, so
 * a crafted `?callbackUrl=https://evil.example` link can't bounce a freshly
 * logged-in user to another site.
 */
export function safeCallbackUrl(raw: string | string[] | undefined | null, fallback = '/'): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  // Must be an absolute path; reject protocol-relative ("//host") and the
  // backslash variant some browsers normalize to it.
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

/** Login URL that returns to `path` afterwards. */
export function loginUrl(path: string): string {
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}
