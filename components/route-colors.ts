/**
 * One color per car, shared by the route map and the route cards so "the
 * amber line" and "the amber card" are visibly the same car.
 */
export const ROUTE_COLORS = ['#fbbf24', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#f97316'];

export const routeColor = (index: number): string => ROUTE_COLORS[index % ROUTE_COLORS.length];
