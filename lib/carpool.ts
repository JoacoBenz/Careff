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

/** Coordinates of an address, used to build precise map links. */
export interface LatLon {
  lat: number;
  lon: number;
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

/** ~1 m precision — keeps the link short without losing the pickup point. */
const roundCoord = (n: number): number => Math.round(n * 1e5) / 1e5;

/**
 * Google Maps directions deep link for a route (no API key required).
 *
 * Prefers coordinates when available: verbose text like "Comuna 4, Ciudad
 * Autónoma de Buenos Aires" often fails to geocode in Google Maps ("no se
 * encuentra ese lugar") and bloats the URL, whereas "lat,lng" always resolves
 * and stays short. `travelmode=driving` forces the car route instead of
 * whatever mode the user last had open (e.g. public transit).
 */
export function generateMapUrl(route: string[], coords?: Map<string, LatLon>): string {
  const point = (address: string): string => {
    const c = coords?.get(address);
    return c ? `${roundCoord(c.lat)},${roundCoord(c.lon)}` : encodeURIComponent(address);
  };
  const origin = point(route[0]);
  const destination = point(route[route.length - 1]);
  const waypoints = route.slice(1, -1).map(point).join('|');
  const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${origin}&destination=${destination}`;
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
  coords?: Map<string, LatLon>,
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
      mapUrl: generateMapUrl(addresses, coords),
    };
  });

  return {
    assignments,
    routes,
    unassigned,
    totalDistanceMeters: routes.reduce((sum, r) => sum + r.distanceMeters, 0),
  };
}
