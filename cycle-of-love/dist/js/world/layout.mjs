/* World units are approximately metres. Keep geometry and collision in one place. */
export const EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = 0.24;
export const START = { x: 0, z: 9 };
export const ROOM_CENTERS = [-5, 5];
export const WALLS = [
  { x: -10.15, z: -2, w: .3, d: 28, h: 5.2 },
  { x: 10.15, z: -2, w: .3, d: 28, h: 5.2 },
  { x: 0, z: -16.15, w: 20.6, d: .3, h: 5.2 },
  { x: 0, z: 12.15, w: 20.6, d: .3, h: 5.2 },
  { x: -8.175, z: -3, w: 3.65, d: .3, h: 5.2 },
  { x: 0, z: -3, w: 7.3, d: .3, h: 5.2 },
  { x: 8.175, z: -3, w: 3.65, d: .3, h: 5.2 },
  { x: 0, z: -9.5, w: .3, d: 13, h: 5.2 }
];
export const PLINTHS = ROOM_CENTERS.flatMap((x, room) => [
  { x: x - 2.8, z: -9, w: 1.1, d: 1.1, room, object: 0 },
  { x: x + 2.8, z: -11.6, w: 1.1, d: 1.1, room, object: 1 }
]);
export const OBSTACLES = [...WALLS, ...PLINTHS];
export function canStand(x, z) {
  if (x < -9.7 || x > 9.7 || z < -15.7 || z > 11.7) return false;
  return !OBSTACLES.some(box => {
    const dx = Math.max(Math.abs(x - box.x) - box.w / 2, 0);
    const dz = Math.max(Math.abs(z - box.z) - box.d / 2, 0);
    return dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS;
  });
}
export function move(position, dx, dz) {
  // Small substeps prevent crossing thin walls, even after a slow frame.
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .1));
  for (let i = 0; i < count; i++) {
    if (canStand(position.x + dx / count, position.z)) position.x += dx / count;
    if (canStand(position.x, position.z + dz / count)) position.z += dz / count;
  }
  return position;
}
export function zoneAt(position) {
  return position.z < -3.4 ? (position.x < 0 ? 0 : 1) : -1;
}
export function findPath(from, to) {
  // Small navigation grid for the optional guided walk, not for manual movement.
  const step = .4, columns = 49, rows = 69;
  const point = id => ({ x: -9.6 + (id % columns) * step, z: -15.6 + Math.floor(id / columns) * step });
  const nearest = p => {
    let best = -1, distance = Infinity;
    for (let id = 0; id < columns * rows; id++) {
      const q = point(id), d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d < distance && canStand(q.x, q.z)) { best = id; distance = d; }
    }
    return best;
  };
  const start = nearest(from), end = nearest(to), queue = [start], previous = new Map([[start, null]]);
  for (let at = 0; at < queue.length && !previous.has(end); at++) {
    const id = queue[at], x = id % columns, z = Math.floor(id / columns);
    for (const [nx, nz] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]) {
      if (nx < 0 || nx >= columns || nz < 0 || nz >= rows) continue;
      const next = nz * columns + nx, p = point(next);
      if (!previous.has(next) && canStand(p.x, p.z)) { previous.set(next, id); queue.push(next); }
    }
  }
  if (!previous.has(end)) return [];
  const path = [];
  for (let id = end; id !== null; id = previous.get(id)) path.push(point(id));
  path.reverse();
  // Keep corners; skip collinear grid points for a smooth guided walk.
  return path.filter((p, i) => i === 0 || i === path.length-1 ||
    Math.abs((p.x-path[i-1].x)*(path[i+1].z-p.z)-(p.z-path[i-1].z)*(path[i+1].x-p.x)) > .001);
}
