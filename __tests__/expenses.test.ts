import { describe, it, expect } from 'vitest';
import { computeExpense, formatMoney } from '@/lib/expenses';

describe('computeExpense', () => {
  it('derives fuel from distance and consumption', () => {
    // 100 km at 10 L/100km = 10 L; at $1000/L = $10000.
    const r = computeExpense({
      distanceMeters: 100_000,
      litersPer100km: 10,
      pricePerLiter: 1000,
      extras: 0,
      passengers: 3,
      driverPays: true,
    });
    expect(r.fuel).toBe(10_000);
    expect(r.total).toBe(10_000);
  });

  it('adds tolls/extras on top of fuel', () => {
    const r = computeExpense({
      distanceMeters: 50_000,
      litersPer100km: 10,
      pricePerLiter: 1000,
      extras: 2_500,
      passengers: 2,
      driverPays: true,
    });
    expect(r.fuel).toBe(5_000);
    expect(r.extras).toBe(2_500);
    expect(r.total).toBe(7_500);
  });

  it('splits among passengers + driver when driver pays', () => {
    const r = computeExpense({
      distanceMeters: 100_000,
      litersPer100km: 10,
      pricePerLiter: 1000,
      extras: 0,
      passengers: 3,
      driverPays: true,
    });
    // 4 occupants share $10000 → $2500 each.
    expect(r.occupants).toBe(4);
    expect(r.perPassenger).toBe(2_500);
  });

  it('splits among passengers only when driver rides free', () => {
    const r = computeExpense({
      distanceMeters: 100_000,
      litersPer100km: 10,
      pricePerLiter: 1000,
      extras: 0,
      passengers: 4,
      driverPays: false,
    });
    expect(r.occupants).toBe(4);
    expect(r.perPassenger).toBe(2_500);
  });

  it('returns zero per-passenger when there are no passengers', () => {
    const r = computeExpense({
      distanceMeters: 100_000,
      litersPer100km: 10,
      pricePerLiter: 1000,
      extras: 0,
      passengers: 0,
      driverPays: true,
    });
    expect(r.perPassenger).toBe(0);
  });

  it('clamps negative inputs to zero', () => {
    const r = computeExpense({
      distanceMeters: -1000,
      litersPer100km: -5,
      pricePerLiter: -10,
      extras: -100,
      passengers: 2,
      driverPays: true,
    });
    expect(r.fuel).toBe(0);
    expect(r.extras).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe('formatMoney', () => {
  it('formats ARS without decimals', () => {
    const out = formatMoney(2500);
    expect(out).toContain('2.500');
    expect(out).not.toContain(',00');
  });

  it('rounds to the nearest peso', () => {
    expect(formatMoney(2500.7)).toBe(formatMoney(2501));
  });
});
