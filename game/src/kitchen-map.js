// Kitchen map: one job — where things are. Station zones, the walls the
// chef bumps into, and which station is near the chef or under a click.
import { INTERACT_RADIUS, STATIONS } from './config.js';

export const CHEF_RADIUS = 24;
const FLOOR_BOUNDS = { x0: 12, y0: 100, x1: 1268, y1: 708 };

// Every station as one flat list of zones; crates carry their ingredient.
export function stationZones() {
  const zones = STATIONS.crates.map((crate) => ({ kind: 'crate', ing: crate.ing, x: crate.x, y: crate.y, w: crate.w, h: crate.h }));
  zones.push(STATIONS.board, STATIONS.wok, STATIONS.steamer, STATIONS.pass, STATIONS.trash);
  return zones;
}
const ZONES = stationZones();

function pushChefOutOf(chef, rect) {
  const cx = Math.max(rect.x, Math.min(chef.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(chef.y, rect.y + rect.h));
  const dx = chef.x - cx;
  const dy = chef.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= CHEF_RADIUS * CHEF_RADIUS) return;
  if (d2 === 0) { chef.y = rect.y - CHEF_RADIUS; return; }
  const d = Math.sqrt(d2);
  chef.x = cx + (dx / d) * CHEF_RADIUS;
  chef.y = cy + (dy / d) * CHEF_RADIUS;
}

// Keep the chef on the floor and out of every counter.
export function keepChefOnFloor(chef) {
  chef.x = Math.max(FLOOR_BOUNDS.x0, Math.min(FLOOR_BOUNDS.x1, chef.x));
  chef.y = Math.max(FLOOR_BOUNDS.y0, Math.min(FLOOR_BOUNDS.y1, chef.y));
  for (const zone of ZONES) pushChefOutOf(chef, zone);
}

export function zoneCentre(zone) {
  return { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 };
}

export function withinReach(chef, zone) {
  const c = zoneCentre(zone);
  return Math.hypot(chef.x - c.x, chef.y - c.y) <= INTERACT_RADIUS + 40;
}

export function nearestStation(chef) {
  let best = null;
  let bestD = Infinity;
  for (const zone of ZONES) {
    const c = zoneCentre(zone);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestD) { bestD = d; best = zone; }
  }
  return bestD <= INTERACT_RADIUS + 40 ? best : null;
}

export function stationAtPoint(point) {
  for (const zone of ZONES) {
    if (point.x >= zone.x && point.x <= zone.x + zone.w && point.y >= zone.y && point.y <= zone.y + zone.h) return zone;
  }
  return null;
}
