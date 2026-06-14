/**
 * Seat accounting shared by the planner forms: passengers can never outnumber
 * the seats the drivers bring. Pure + unit-testable.
 */
export interface SeatBudget {
  totalSeats: number;
  /** No more seats free (used to lock "add passenger"). */
  seatsFull: boolean;
  /** More passengers than seats (used to block submit). */
  overCapacity: boolean;
}

export function seatBudget(driverCapacities: number[], passengerCount: number): SeatBudget {
  const totalSeats = driverCapacities.reduce((sum, c) => sum + (c || 0), 0);
  return {
    totalSeats,
    seatsFull: passengerCount >= totalSeats,
    overCapacity: passengerCount > totalSeats,
  };
}
