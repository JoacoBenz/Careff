import { describe, it, expect } from 'vitest';
import { registerSchema, paginationSchema, carpoolPlanSchema } from '@/lib/validators';

const validPlan = {
  title: 'Cumple de Martina',
  destination: 'Av. Corrientes 1234',
  drivers: [{ name: 'Ana', address: 'Calle Falsa 123', capacity: 3 }],
  passengers: [{ name: 'Pia', address: 'Av. Siempreviva 742' }],
};

describe('carpoolPlanSchema', () => {
  it('accepts a valid plan and coerces capacity strings', () => {
    const result = carpoolPlanSchema.parse({
      ...validPlan,
      drivers: [{ ...validPlan.drivers[0], capacity: '3' }],
    });
    expect(result.drivers[0].capacity).toBe(3);
    expect(result.city).toBeUndefined();
  });

  it('rejects plans without drivers', () => {
    expect(carpoolPlanSchema.safeParse({ ...validPlan, drivers: [] }).success).toBe(false);
  });

  it('rejects capacities outside 1-8', () => {
    const plan = { ...validPlan, drivers: [{ ...validPlan.drivers[0], capacity: 9 }] };
    expect(carpoolPlanSchema.safeParse(plan).success).toBe(false);
  });

  it('caps passengers at 30', () => {
    const passengers = Array.from({ length: 31 }, (_, i) => ({
      name: `P${i}`,
      address: `Calle ${i} 100`,
    }));
    expect(carpoolPlanSchema.safeParse({ ...validPlan, passengers }).success).toBe(false);
  });
});

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
