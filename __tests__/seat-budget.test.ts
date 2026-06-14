import { describe, it, expect } from 'vitest';
import { seatBudget } from '@/lib/seat-budget';

describe('seatBudget', () => {
  it('sums seats and reports spare capacity', () => {
    const b = seatBudget([3, 2], 4);
    expect(b.totalSeats).toBe(5);
    expect(b.seatsFull).toBe(false);
    expect(b.overCapacity).toBe(false);
  });

  it('marks seatsFull when passengers equal seats', () => {
    const b = seatBudget([3], 3);
    expect(b.seatsFull).toBe(true);
    expect(b.overCapacity).toBe(false);
  });

  it('flags overCapacity when passengers exceed seats', () => {
    expect(seatBudget([2], 3).overCapacity).toBe(true);
  });

  it('treats no seats as full', () => {
    const b = seatBudget([], 0);
    expect(b.totalSeats).toBe(0);
    expect(b.seatsFull).toBe(true);
    expect(b.overCapacity).toBe(false);
  });
});
