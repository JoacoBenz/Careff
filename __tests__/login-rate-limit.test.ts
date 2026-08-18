import { describe, it, expect, beforeEach } from 'vitest';
import { allowLoginAttempt, _resetRateLimits } from '@/lib/rate-limit';

beforeEach(() => _resetRateLimits());

describe('allowLoginAttempt', () => {
  it('blocks an account after 10 attempts in the window, regardless of source IP', () => {
    for (let i = 0; i < 10; i++) {
      expect(allowLoginAttempt(`10.0.0.${i}`, 'victim@mail.com')).toBe(true);
    }
    expect(allowLoginAttempt('10.0.0.99', 'victim@mail.com')).toBe(false);
  });

  it('normalizes the account key (case and whitespace)', () => {
    for (let i = 0; i < 10; i++) allowLoginAttempt(`10.0.1.${i}`, 'User@Mail.com');
    expect(allowLoginAttempt('10.0.1.99', '  user@mail.com ')).toBe(false);
  });

  it('blocks a single IP after 30 attempts across different accounts', () => {
    for (let i = 0; i < 30; i++) {
      expect(allowLoginAttempt('9.9.9.9', `user${i}@mail.com`)).toBe(true);
    }
    expect(allowLoginAttempt('9.9.9.9', 'fresh@mail.com')).toBe(false);
  });

  it('does not throttle unrelated accounts or IPs', () => {
    for (let i = 0; i < 10; i++) allowLoginAttempt('8.8.8.8', 'a@mail.com');
    expect(allowLoginAttempt('8.8.4.4', 'b@mail.com')).toBe(true);
  });
});
