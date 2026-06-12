import { profileCookieSchema, type ProfileCookie } from './validators';

/**
 * Long-lived cookie that remembers how someone last introduced themselves
 * (name, departure address, car + seats) so join forms come prefilled even
 * without an account.
 */
export const PROFILE_COOKIE = 'careff-profile';

export function parseProfileCookie(raw: string | undefined): ProfileCookie | null {
  if (!raw) return null;
  try {
    return profileCookieSchema.parse(JSON.parse(decodeURIComponent(raw)));
  } catch (error) {
    void error; // malformed or outdated cookie: treat as absent
    return null;
  }
}
