/**
 * Carpool planning domain logic. Pure functions: distances are injected via a
 * DistanceFn so the algorithm is testable without network access (see
 * lib/geo.ts for the real provider).
 *
 * Algorithm (ported from the original MartinaAutos Python app): greedy
 * nearest-driver assignment — each passenger is assigned to the closest driver
 * with remaining seats, then each driver's pickups are ordered nearest-first
 * starting from the driver's address.
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

function orderPickups(start: string, pickups: RouteStop[], distance: DistanceFn): RouteStop[] {
  const remaining = [...pickups];
  const ordered: RouteStop[] = [];
  let current = start;
  while (remaining.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (
        distance(current, remaining[i].address) < distance(current, remaining[bestIndex].address)
      ) {
        bestIndex = i;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next.address;
  }
  return ordered;
}

function routeDistance(addresses: string[], distance: DistanceFn): number {
  let total = 0;
  for (let i = 0; i < addresses.length - 1; i++) {
    total += distance(addresses[i], addresses[i + 1]);
  }
  return total;
}

export function planCarpool(
  drivers: DriverInput[],
  passengers: PassengerInput[],
  destination: string,
  distance: DistanceFn,
): CarpoolPlanResult {
  const seatsLeft = new Map(drivers.map((d) => [d.name, d.capacity]));
  const assignments: Record<string, string> = {};
  const pickupsByDriver = new Map<string, RouteStop[]>(drivers.map((d) => [d.name, []]));
  const unassigned: string[] = [];

  for (const passenger of passengers) {
    let nearest: DriverInput | null = null;
    let nearestDistance = Infinity;
    for (const driver of drivers) {
      if ((seatsLeft.get(driver.name) ?? 0) <= 0) continue;
      const d = distance(passenger.address, driver.address);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = driver;
      }
    }
    if (nearest === null) {
      unassigned.push(passenger.name);
      continue;
    }
    seatsLeft.set(nearest.name, (seatsLeft.get(nearest.name) ?? 0) - 1);
    assignments[passenger.name] = nearest.name;
    pickupsByDriver.get(nearest.name)?.push({ name: passenger.name, address: passenger.address });
  }

  const routes: DriverRoute[] = drivers.map((driver) => {
    const stops = orderPickups(driver.address, pickupsByDriver.get(driver.name) ?? [], distance);
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
