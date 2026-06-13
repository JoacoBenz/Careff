/**
 * Carpool planning domain logic. Pure functions: distances are injected via a
 * DistanceFn so the algorithm is testable without network access (see
 * lib/geo.ts for the real provider).
 *
 * Algorithm: global cheapest-insertion (see planCarpool). Each round, the
 * passenger/driver/route-position with the smallest added distance across ALL
 * cars is committed, so the whole set of trips stays efficient with several
 * drivers — not just "nearest driver to each passenger's home".
 */

export interface DriverInput {
  name: string;
  address: string;
  capacity: number;
}

export interface PassengerInput {
  name: string;
  address: string;
}

/** Driving distance in meters between two known addresses. */
export type DistanceFn = (from: string, to: string) => number;

/**
 * Appends the trip's city to a hand-typed address so it geocodes, but leaves
 * the address alone when it already mentions the city or is a canonical
 * geocoder result (picked from autocomplete — those always carry several
 * comma-separated parts and re-appending the city breaks geocoding).
 */
export function withCity(address: string, city?: string): string {
  if (!city) return address;
  const trimmedCity = city.trim();
  if (trimmedCity.length === 0) return address;
  const isCanonical = address.split(',').length >= 4;
  const mentionsCity = address.toLowerCase().includes(trimmedCity.toLowerCase());
  if (isCanonical || mentionsCity) return address;
  return `${address}, ${trimmedCity}`;
}

export interface RouteStop {
  name: string;
  address: string;
}

export interface DriverRoute {
  driver: string;
  /** Passenger pickups in driving order (excludes the driver and destination). */
  stops: RouteStop[];
  /** Full ordered route: driver address, pickups, destination. */
  addresses: string[];
  distanceMeters: number;
  mapUrl: string;
}

export interface CarpoolPlanResult {
  /** passenger name -> driver name */
  assignments: Record<string, string>;
  routes: DriverRoute[];
  /** Passengers that did not fit in any car. */
  unassigned: string[];
  totalDistanceMeters: number;
}

/** Google Maps directions deep link for a route (no API key required). */
export function generateMapUrl(route: string[]): string {
  const origin = encodeURIComponent(route[0]);
  const destination = encodeURIComponent(route[route.length - 1]);
  const waypoints = route.slice(1, -1).map(encodeURIComponent).join('|');
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  return waypoints ? `${url}&waypoints=${waypoints}` : url;
}

function routeDistance(addresses: string[], distance: DistanceFn): number {
  let total = 0;
  for (let i = 0; i < addresses.length - 1; i++) {
    total += distance(addresses[i], addresses[i + 1]);
  }
  return total;
}

/**
 * Global cheapest-insertion: repeatedly pick the (passenger, driver, position)
 * whose insertion adds the least distance across ALL drivers' routes. Unlike
 * "nearest driver by home", this sends a passenger to whichever car can detour
 * for them most cheaply, so the trip set as a whole stays efficient even with
 * several drivers.
 */
export function planCarpool(
  drivers: DriverInput[],
  passengers: PassengerInput[],
  destination: string,
  distance: DistanceFn,
): CarpoolPlanResult {
  const seatsLeft = new Map(drivers.map((d) => [d.name, d.capacity]));
  const stopsByDriver = new Map<string, RouteStop[]>(drivers.map((d) => [d.name, []]));
  const assignments: Record<string, string> = {};
  const unassigned: string[] = [];

  const pool = [...passengers];
  while (pool.length > 0) {
    let best: {
      poolIndex: number;
      driver: DriverInput;
      position: number;
      cost: number;
    } | null = null;

    for (let p = 0; p < pool.length; p++) {
      const passenger = pool[p];
      for (const driver of drivers) {
        if ((seatsLeft.get(driver.name) ?? 0) <= 0) continue;
        const stops = stopsByDriver.get(driver.name) ?? [];
        const route = [driver.address, ...stops.map((s) => s.address), destination];
        for (let position = 0; position < route.length - 1; position++) {
          const cost =
            distance(route[position], passenger.address) +
            distance(passenger.address, route[position + 1]) -
            distance(route[position], route[position + 1]);
          if (best === null || cost < best.cost) {
            best = { poolIndex: p, driver, position, cost };
          }
        }
      }
    }

    if (best === null) {
      // No seats left anywhere: everyone still in the pool stays unassigned.
      unassigned.push(...pool.map((p) => p.name));
      break;
    }

    const [passenger] = pool.splice(best.poolIndex, 1);
    seatsLeft.set(best.driver.name, (seatsLeft.get(best.driver.name) ?? 0) - 1);
    assignments[passenger.name] = best.driver.name;
    stopsByDriver
      .get(best.driver.name)
      ?.splice(best.position, 0, { name: passenger.name, address: passenger.address });
  }

  const routes: DriverRoute[] = drivers.map((driver) => {
    const stops = stopsByDriver.get(driver.name) ?? [];
    const addresses = [driver.address, ...stops.map((s) => s.address), destination];
    return {
      driver: driver.name,
      stops,
      addresses,
      distanceMeters: routeDistance(addresses, distance),
      mapUrl: generateMapUrl(addresses),
    };
  });

  return {
    assignments,
    routes,
    unassigned,
    totalDistanceMeters: routes.reduce((sum, r) => sum + r.distanceMeters, 0),
  };
}
