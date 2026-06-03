// reachability.js — per-rank A* pathfinding + per-rank straight-line reach.
// Pure model. Both matrices computed once at boot.
//
// v1.13: per-unit pathfinding. Only units with `pathfinds: true` use the A*
// waypoints. Default units take straight lines and are blocked if their
// rank's blockers cross the direct line. The active unit per (owner, rank)
// is resolved from state.loadouts at runtime.
//
// State outputs:
//   state.pathfindingWaypoints[rank][srcId][dstId] — A* polyline or null.
//   state.pathfindingReach[rank][srcId][dstId]     — 'free' | 'penalised' | 'blocked'.
//   state.straightReach[rank][srcId][dstId]        — same, straight-line only.
//
// Public surface:
//   buildPathInfo(state, terrainRegions)
//   pathReachability(state, srcId, dstId)
//   pathHasLos(state, srcId, dstId)
//   getPathWaypoints(state, srcId, dstId, rank, pathfinds)
//   segmentSpeedAtT() — legacy stub.

import { RANKS, TERRAIN_EFFECTS, UNITS } from '../data/store.js';

const CELL = 30;
const STRAIGHT_SAMPLES = 32;

export function buildPathInfo(state, terrainRegions) {
  const W = state.mapWidth, H = state.mapHeight;
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const factoryRadius = state.config?.factoryRadius ?? 36;

  // Per-cell terrain type (first match wins).
  const terrainGrid = new Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL + CELL / 2;
      const y = r * CELL + CELL / 2;
      let t = null;
      for (const region of terrainRegions) {
        if (pointInPoly(x, y, region.poly)) { t = region.type; break; }
      }
      terrainGrid[r * cols + c] = t;
    }
  }

  // Per-cell factory occupancy.
  const factoryGrid = new Array(cols * rows).fill(null);
  for (const f of state.factories) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL + CELL / 2;
        const y = r * CELL + CELL / 2;
        if (Math.hypot(f.x - x, f.y - y) <= factoryRadius) {
          factoryGrid[r * cols + c] = f.id;
        }
      }
    }
  }

  const pfWp = {};
  const pfReach = {};
  const stReach = {};
  for (const rank of RANKS) {
    pfWp[rank] = {};
    pfReach[rank] = {};
    stReach[rank] = {};
  }

  for (const src of state.factories) {
    for (const rank of RANKS) {
      pfWp[rank][src.id] = {};
      pfReach[rank][src.id] = {};
      stReach[rank][src.id] = {};
    }
    const srcCell = nearestCellTo(src, cols, rows);
    for (const dst of state.factories) {
      if (dst.id === src.id) continue;
      const dstCell = nearestCellTo(dst, cols, rows);
      for (const rank of RANKS) {
        // A* path (for pathfinding units).
        const result = aStar(srcCell, dstCell, cols, rows, terrainGrid, factoryGrid, src.id, dst.id, rank);
        if (!result) {
          pfWp[rank][src.id][dst.id] = null;
          pfReach[rank][src.id][dst.id] = 'blocked';
        } else {
          const wp = [{ x: src.x, y: src.y }, ...result.cells.map(([c, r]) => ({
            x: c * CELL + CELL / 2,
            y: r * CELL + CELL / 2,
          })), { x: dst.x, y: dst.y }];
          pfWp[rank][src.id][dst.id] = wp;
          pfReach[rank][src.id][dst.id] = result.penalised ? 'penalised' : 'free';
        }
        // Straight-line check (for non-pathfinding units).
        stReach[rank][src.id][dst.id] = straightLineReach(src, dst, state.factories, terrainRegions, rank, factoryRadius);
      }
    }
  }

  state.pathfindingWaypoints = pfWp;
  state.pathfindingReach = pfReach;
  state.straightReach = stReach;
  // Back-compat for any other caller that hasn't been migrated yet.
  state.pathWaypoints = pfWp;
  state.pathReach = pfReach;
  state.pathSegments = null;
  state.pathLos = null;
}

// Look up the unit the source factory would spawn (loadout) and return that
// unit's `pathfinds` flag. Defaults to false (default workers don't pathfind).
function sourceUsesPathfinding(state, src) {
  const unitId = state.loadouts?.[src.owner]?.[src.rank];
  const unitDef = unitId ? UNITS[unitId] : null;
  return !!unitDef?.pathfinds;
}

export function pathReachability(state, srcId, dstId) {
  if (srcId === dstId) return 'free';
  const src = state.factories.find(f => f.id === srcId);
  if (!src || !src.rank) return 'free';
  // Neutral factories never spawn — assume pathfinding for the snap indicator
  // (so the player can see "this path COULD work for some unit").
  const ownerForReach = src.owner || 'player';
  const unitId = state.loadouts?.[ownerForReach]?.[src.rank];
  const unitDef = unitId ? UNITS[unitId] : null;
  const usePathfinding = !!unitDef?.pathfinds;
  const matrix = usePathfinding ? state.pathfindingReach : state.straightReach;
  return matrix?.[src.rank]?.[srcId]?.[dstId] || 'free';
}

export function pathHasLos(state, srcId, dstId) {
  return pathReachability(state, srcId, dstId) !== 'blocked';
}

export function getPathWaypoints(state, srcId, dstId, rank, pathfinds) {
  if (pathfinds) {
    return state.pathfindingWaypoints?.[rank]?.[srcId]?.[dstId] || null;
  }
  // Straight-line: just src→dst as a 2-point polyline. (Caller must have
  // verified reachability — straightReach should be != 'blocked'.)
  const src = state.factories.find(f => f.id === srcId);
  const dst = state.factories.find(f => f.id === dstId);
  if (!src || !dst) return null;
  return [{ x: src.x, y: src.y }, { x: dst.x, y: dst.y }];
}

export function segmentSpeedAtT() { return 1.0; }

// ─── straight-line reach (for non-pathfinding units) ────────────────────

function straightLineReach(src, dst, factories, terrainRegions, rank, factoryRadius) {
  // Intervening factory body in straight line?
  for (const f of factories) {
    if (f.id === src.id || f.id === dst.id) continue;
    if (pointToSegmentDistance(f.x, f.y, src.x, src.y, dst.x, dst.y) <= factoryRadius) {
      return 'blocked';
    }
  }
  // Sample points along the line; if any sample is in a blocker, return 'blocked';
  // if any sample is in a slow terrain, return 'penalised'.
  let penalised = false;
  for (let i = 0; i <= STRAIGHT_SAMPLES; i++) {
    const t = i / STRAIGHT_SAMPLES;
    const x = src.x + (dst.x - src.x) * t;
    const y = src.y + (dst.y - src.y) * t;
    for (const region of terrainRegions) {
      if (!pointInPoly(x, y, region.poly)) continue;
      const eff = TERRAIN_EFFECTS[region.type]?.[rank];
      if (!eff) continue;
      if (eff.blocked) return 'blocked';
      if (eff.speedMul !== undefined && eff.speedMul < 1.0) penalised = true;
    }
  }
  return penalised ? 'penalised' : 'free';
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// ─── A* (unchanged from v1.11) ──────────────────────────────────────────

function aStar(start, goal, cols, rows, terrainGrid, factoryGrid, srcId, dstId, rank) {
  const startKey = key(start[0], start[1], cols);
  const goalKey = key(goal[0], goal[1], cols);
  const open = new Map();
  const closed = new Set();
  open.set(startKey, { c: start[0], r: start[1], g: 0, f: heuristic(start[0], start[1], goal[0], goal[1]), parent: null, penalised: false });
  while (open.size > 0) {
    let bestKey = null, bestNode = null, bestF = Infinity;
    for (const [k, n] of open) {
      if (n.f < bestF) { bestF = n.f; bestKey = k; bestNode = n; }
    }
    open.delete(bestKey);
    closed.add(bestKey);
    if (bestKey === goalKey) {
      const cells = [];
      let cur = bestNode;
      let anyPenalised = false;
      while (cur) {
        cells.push([cur.c, cur.r]);
        if (cur.penalised) anyPenalised = true;
        cur = cur.parent;
      }
      cells.reverse();
      return { cells, penalised: anyPenalised };
    }
    for (const [dc, dr, d] of NEIGHBOURS) {
      const nc = bestNode.c + dc;
      const nr = bestNode.r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nk = key(nc, nr, cols);
      if (closed.has(nk)) continue;
      const isStartOrGoal = (nc === start[0] && nr === start[1]) || (nc === goal[0] && nr === goal[1]);
      if (!isPassable(nc, nr, cols, rows, terrainGrid, factoryGrid, srcId, dstId, rank, isStartOrGoal)) continue;
      const cellTerrain = terrainGrid[nr * cols + nc];
      const eff = cellTerrain ? TERRAIN_EFFECTS[cellTerrain]?.[rank] : null;
      const slowMul = (eff && eff.speedMul && eff.speedMul < 1.0) ? (1.0 / eff.speedMul) : 1.0;
      const tentativeG = bestNode.g + d * slowMul;
      const existing = open.get(nk);
      if (existing && tentativeG >= existing.g) continue;
      open.set(nk, {
        c: nc, r: nr,
        g: tentativeG,
        f: tentativeG + heuristic(nc, nr, goal[0], goal[1]),
        parent: bestNode,
        penalised: bestNode.penalised || slowMul > 1.0,
      });
    }
  }
  return null;
}

const SQRT2 = Math.SQRT2;
const NEIGHBOURS = [
  [ 1,  0, 1],     [-1,  0, 1],     [ 0,  1, 1],     [ 0, -1, 1],
  [ 1,  1, SQRT2], [-1,  1, SQRT2], [ 1, -1, SQRT2], [-1, -1, SQRT2],
];

function heuristic(c1, r1, c2, r2) {
  const dx = Math.abs(c1 - c2), dy = Math.abs(r1 - r2);
  return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy);
}

function key(c, r, cols) { return r * cols + c; }

function isPassable(c, r, cols, rows, terrainGrid, factoryGrid, srcId, dstId, rank, isStartOrGoal) {
  const i = r * cols + c;
  const occupant = factoryGrid[i];
  if (occupant && occupant !== srcId && occupant !== dstId) return false;
  const t = terrainGrid[i];
  if (t) {
    const eff = TERRAIN_EFFECTS[t]?.[rank];
    if (eff && eff.blocked) return false;
  }
  return true;
}

function nearestCellTo(f, cols, rows) {
  const c = Math.max(0, Math.min(cols - 1, Math.floor(f.x / CELL)));
  const r = Math.max(0, Math.min(rows - 1, Math.floor(f.y / CELL)));
  return [c, r];
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
