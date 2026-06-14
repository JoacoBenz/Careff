import { describe, it, expect } from 'vitest';
import { parseProfileCookie } from '@/lib/profile-cookie';

describe('parseProfileCookie', () => {
  const encode = (obj: unknown) => encodeURIComponent(JSON.stringify(obj));

  it('parses a valid cookie payload', () => {
    const parsed = parseProfileCookie(
      encode({ name: 'Ada', address: 'Calle 1', hasCar: true, seats: 3 }),
    );
    expect(parsed).toEqual({ name: 'Ada', address: 'Calle 1', hasCar: true, seats: 3 });
  });

  it('returns null for an undefined cookie', () => {
    expect(parseProfileCookie(undefined)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseProfileCookie('not%20json')).toBeNull();
  });

  it('returns null when the shape is invalid (untrusted input)', () => {
    expect(parseProfileCookie(encode({ name: 'Ada' }))).toBeNull();
    expect(
      parseProfileCookie(encode({ name: 'Ada', address: 'x', hasCar: 'yes', seats: 2 })),
    ).toBeNull();
  });
});
