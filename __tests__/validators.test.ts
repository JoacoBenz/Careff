import { describe, it, expect } from 'vitest';
import { registerSchema, paginationSchema } from '@/lib/validators';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'User',
      password: 'supersecret',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'User',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('applies defaults and coerces strings', () => {
    const result = paginationSchema.parse({ page: '2' });
    expect(result).toEqual({ page: 2, pageSize: 20 });
  });

  it('caps pageSize at 100', () => {
    expect(paginationSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});
