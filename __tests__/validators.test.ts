import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  paginationSchema,
  carpoolPlanSchema,
  joinGroupSchema,
} from '@/lib/validators';

describe('joinGroupSchema', () => {
  const base = {
    token: 'abc123def456',
    name: 'Pia',
    address: 'Av. Siempreviva 742',
  };

  it('accepts a passenger without a car (seats default 0)', () => {
    const result = joinGroupSchema.parse({ ...base, hasCar: false });
    expect(result.seats).toBe(0);
  });

  it('accepts a driver with seats and coerces strings', () => {
    const result = joinGroupSchema.parse({ ...base, hasCar: true, seats: '4' });
    expect(result.seats).toBe(4);
  });

  it('rejects a driver with zero seats', () => {
    expect(joinGroupSchema.safeParse({ ...base, hasCar: true, seats: 0 }).success).toBe(false);
  });

  it('rejects seats above 8', () => {
    expect(joinGroupSchema.safeParse({ ...base, hasCar: true, seats: 9 }).success).toBe(false);
  });
});

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

  it('accepts an optional coords map keyed by address', () => {
    const result = carpoolPlanSchema.safeParse({
      ...validPlan,
      coords: { 'Av. Corrientes 1234': { lat: -34.6, lon: -58.39 } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects coords entries missing lat/lon', () => {
    const plan = { ...validPlan, coords: { 'Av. Corrientes 1234': { lat: -34.6 } } };
    expect(carpoolPlanSchema.safeParse(plan).success).toBe(false);
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
