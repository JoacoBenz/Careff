/**
 * Per-car trip cost + fair split. Pure (no env/network), so it's unit-testable
 * and shared by the result UI. Fuel is derived from the route distance we
 * already compute; tolls/extras are entered manually.
 */

export interface ExpenseInput {
  distanceMeters: number;
  /** Fuel consumption in litres per 100 km. */
  litersPer100km: number;
  /** Fuel price per litre, in the trip's currency. */
  pricePerLiter: number;
  /** Tolls + any extra costs for this car. */
  extras: number;
  /** Passengers this car picks up (excludes the driver). */
  passengers: number;
  /** Whether the driver shares the cost too (equal split) or rides "free". */
  driverPays: boolean;
  /** Driver returns home after the destination — doubles the fuel distance. */
  roundTrip?: boolean;
}

export interface ExpenseResult {
  fuel: number;
  extras: number;
  total: number;
  /** People the cost is divided among. */
  occupants: number;
  /** What each passenger reimburses the driver. */
  perPassenger: number;
}

export function computeExpense(input: ExpenseInput): ExpenseResult {
  const oneWayKm = Math.max(0, input.distanceMeters) / 1000;
  // Round trip: the driver also drives the same route back home.
  const km = input.roundTrip ? oneWayKm * 2 : oneWayKm;
  const liters = (km / 100) * Math.max(0, input.litersPer100km);
  const fuel = liters * Math.max(0, input.pricePerLiter);
  const extras = Math.max(0, input.extras);
  const total = fuel + extras;

  const passengers = Math.max(0, input.passengers);
  const occupants = passengers + (input.driverPays ? 1 : 0);
  // Each passenger pays one share; the driver keeps their own share (if any).
  const perPassenger = occupants > 0 && passengers > 0 ? total / occupants : 0;

  return { fuel, extras, total, occupants, perPassenger };
}

/** ARS-style currency formatting (no decimals — amounts are rough estimates). */
export function formatMoney(amount: number, currency = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `$${Math.round(amount)}`;
  }
}
