import { describe, it, expect } from 'vitest';
import { loginUrl, safeCallbackUrl } from '@/lib/safe-redirect';

describe('safeCallbackUrl', () => {
  it('keeps same-site paths, including query strings', () => {
    expect(safeCallbackUrl('/groups')).toBe('/groups');
    expect(safeCallbackUrl('/groups/12?tab=members')).toBe('/groups/12?tab=members');
  });

  it('falls back when missing', () => {
    expect(safeCallbackUrl(undefined)).toBe('/');
    expect(safeCallbackUrl('')).toBe('/');
    expect(safeCallbackUrl(null, '/planner')).toBe('/planner');
  });

  it('rejects anything that could leave the site', () => {
    for (const evil of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'groups',
    ]) {
      expect(safeCallbackUrl(evil)).toBe('/');
    }
  });

  it('uses the first value of a repeated param', () => {
    expect(safeCallbackUrl(['/plans', '/profile'])).toBe('/plans');
    expect(safeCallbackUrl(['//evil.example', '/plans'])).toBe('/');
  });
});

describe('loginUrl', () => {
  it('encodes the return path', () => {
    expect(loginUrl('/groups/3')).toBe('/login?callbackUrl=%2Fgroups%2F3');
    expect(
      safeCallbackUrl(new URL(loginUrl('/a?b=c'), 'http://x').searchParams.get('callbackUrl')),
    ).toBe('/a?b=c');
  });
});
