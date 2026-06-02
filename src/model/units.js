// units.js — unit movement (waypoint-following), arrival, per-rank collision.
// v1.11: units follow A* waypoint polylines (state.pathWaypoints) instead of
// straight lines. Each unit holds a `waypoints` array assigned at spawn, plus
// `segmentIdx` and `segmentT` tracking its current segment. Movement advances
// segmentT; when it reaches the next waypoint, segmentIdx increments. Arrival
// when segmentIdx reaches the last segment AND segmentT >= 1.
//
// Public surface:
//   tickUnits(state, dt) — advance, arrive, resolve collisions, sweep dead.

import { getFactory } from './state.js';
import { onCaptured } from './factories.js';
import { UNIT_TYPES } from '../data/unitTypes.js';
import { RANK_COST, RANK_MAX_POP } from '../data/ranks.js';
import { TERRAIN_EFFECTS } from '../data/terrain.js';

export function tickUnits(state, dt) {
  const initialLen = state.units.length;
  for (let i = 0; i < initialLen; i++) {
    const u = state.units[i];
    if (u.dead) continue;
    if (!u.waypoints || u.waypoints.length < 2) { u.dead = true; continue; }

    advanceUnit(state, u, dt);
    if (u.dead) continue;
    if (u.arrived) {
      u.dead = true;
      const dst = getFactory(state, u.dstId);
      if (!dst) continue;
      if (dst.owner === u.owner) {
        // v1.14: friendly arrival — pop += cost AND inflowBoost += cost.
        // No instant pass-through emit (the v1.8 burst-forward is GONE).
        // Inflow drives a smooth rate boost via factory.inflowBoost, which
        // shortens the gen interval in currentGenInterval() until it decays.
        const arrivingCost = RANK_COST[u.rank] ?? 1;
        const maxPop = RANK_MAX_POP[dst.rank] ?? 999;
        dst.population = Math.min(maxPop, dst.population + arrivingCost);
        dst.inflowBoost = (dst.inflowBoost || 0) + arrivingCost;
      } else {
        // v1.20: factory damage is now `u.factoryDamage` (per-unit), letting
        // ranged units siege weaker than they fight (sharpshooter 0, mortar 1,
        // artillery 3). Falls back to u.damage if unset. Overkill still captures.
        const dmg = (u.factoryDamage ?? u.damage ?? 1);
        const newPop = dst.population - dmg;
        if (newPop < 0) {
          onCaptured(dst, u.owner, state);
        } else {
          dst.population = newPop;
        }
      }
    }
  }
  resolveUnitCollisions(state);
  tickRangedFire(state, dt);
  state.units = state.units.filter(u => !u.dead);
}

// v1.12 + v1.13: optimized ranged-fire pass.
// Step 1: bucket live units by their (srcId|dstId|owner) invasion stream once
//         per frame. Each bucket has a straight-line src→dst as a cheap proxy.
// Step 2: for each shooter, only consider buckets whose proxy line falls within
//         the shooter's range. If no buckets pass the line-distance pre-filter,
//         skip the per-unit scan entirely.
// Step 3: within passing buckets, scan units for the closest in-range target.
// This avoids O(N²) when most ranged units have no enemies in range.
function tickRangedFire(state, dt) {
  if (!state.shots) state.shots = [];

  // Decrement cooldowns once per ranged unit.
  let anyReady = false;
  for (const u of state.units) {
    if (u.dead || !u.range || u.range <= 0) continue;
    u.fireTimer = Math.max(0, (u.fireTimer || 0) - dt);
    if (u.fireTimer <= 0) anyReady = true;
  }
  if (!anyReady) return;

  // Bucket live units by invasion stream.
  // Key: "srcId|dstId|owner".  Value: { lineX1,Y1,X2,Y2, owner, units[] }.
  const buckets = new Map();
  for (const u of state.units) {
    if (u.dead) continue;
    const src = getFactory(state, u.srcId);
    const dst = getFactory(state, u.dstId);
    if (!src || !dst) continue;
    const key = u.srcId + '|' + u.dstId + '|' + u.owner;
    let b = buckets.get(key);
    if (!b) {
      b = {
        x1: src.x, y1: src.y, x2: dst.x, y2: dst.y,
        owner: u.owner,
        units: [],
      };
      buckets.set(key, b);
    }
    b.units.push(u);
  }

  // Per shooter, line-proximity pre-filter, then per-target distance.
  for (const u of state.units) {
    if (u.dead || !u.range || u.range <= 0 || u.fireTimer > 0) continue;
    let bestTarget = null;
    let bestDist = u.range;
    for (const b of buckets.values()) {
      if (b.owner === u.owner) continue;
      // Cheap pre-filter: shooter-to-stream-line distance vs range.
      const lineDist = pointToSegmentDistance(u.x, u.y, b.x1, b.y1, b.x2, b.y2);
      if (lineDist > u.range) continue;
      // Only now scan this bucket's units.
      for (const v of b.units) {
        if (v.dead) continue;
        const dx = u.x - v.x, dy = u.y - v.y;
        const d = Math.hypot(dx, dy);
        if (d <= bestDist) { bestDist = d; bestTarget = v; }
      }
    }
    if (!bestTarget) continue;
    bestTarget.hp -= (u.damage || 1);
    if (bestTarget.hp <= 0) bestTarget.dead = true;
    u.fireTimer = u.fireCooldownSec || 1.0;
    state.shots.push({
      x1: u.x, y1: u.y, x2: bestTarget.x, y2: bestTarget.y,
      owner: u.owner,
      until: state.elapsed + 0.18,
    });
  }
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

function advanceUnit(state, u, dt) {
  const wp = u.waypoints;
  const segCount = wp.length - 1;
  // Loop in case dt covers multiple short segments.
  let budget = dt;
  while (budget > 0 && !u.arrived && !u.dead) {
    const a = wp[u.segmentIdx];
    const b = wp[u.segmentIdx + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (segLen <= 0) {
      u.segmentIdx++;
      u.segmentT = 0;
      if (u.segmentIdx >= segCount) { u.arrived = true; break; }
      continue;
    }
    // Sample current world position to pick up terrain speed-mul.
    const midX = a.x + (b.x - a.x) * u.segmentT;
    const midY = a.y + (b.y - a.y) * u.segmentT;
    const speedMul = terrainSpeedAt(state, midX, midY, u.rank);
    const speed = u.baseSpeed * speedMul;
    const remainingFrac = 1 - u.segmentT;
    const remainingDist = remainingFrac * segLen;
    const dist = speed * budget;
    if (dist >= remainingDist) {
      // Finish this segment, carry leftover to next.
      const usedTime = remainingDist / speed;
      budget -= usedTime;
      u.segmentIdx++;
      u.segmentT = 0;
      if (u.segmentIdx >= segCount) { u.arrived = true; break; }
    } else {
      u.segmentT += dist / segLen;
      budget = 0;
    }
  }
  // Update world position for renderer + collision math.
  if (!u.arrived) {
    const a = wp[u.segmentIdx];
    const b = wp[u.segmentIdx + 1];
    u.x = a.x + (b.x - a.x) * u.segmentT;
    u.y = a.y + (b.y - a.y) * u.segmentT;
  } else {
    const last = wp[wp.length - 1];
    u.x = last.x; u.y = last.y;
  }
  // Path progress 0..1 across the WHOLE polyline (for legacy collision math).
  u.t = (u.segmentIdx + u.segmentT) / Math.max(1, segCount);
}

function terrainSpeedAt(state, x, y, rank) {
  const regions = state.terrainRegions || [];
  for (const r of regions) {
    if (pointInPoly(x, y, r.poly)) {
      const eff = TERRAIN_EFFECTS[r.type]?.[rank];
      if (!eff || eff.blocked) return 1.0;     // shouldn't happen — path A*'d around blockers
      return eff.speedMul ?? 1.0;
    }
  }
  return 1.0;
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

// Collisions: same-edge opposite-direction units collide and trade per-rank damage.
// v1.11: with pathfinding, "same edge" means same (src,dst) pair AND units are
// near each other in world space. Use a simple proximity check.
const COLLISION_RADIUS = 14;

function resolveUnitCollisions(state) {
  const live = [];
  for (const u of state.units) if (!u.dead) live.push(u);
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    if (a.dead) continue;
    for (let j = i + 1; j < live.length; j++) {
      const b = live[j];
      if (b.dead) continue;
      if (a.owner === b.owner) continue;
      // Same undirected pair, opposite direction (mirror src/dst).
      if (a.srcId !== b.dstId || a.dstId !== b.srcId) continue;
      if (a.collidedWith && a.collidedWith.has(b.id)) continue;
      // Proximity check (units crossing in world space).
      const d = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
      if (d > COLLISION_RADIUS * 2) continue;

      const aDmg = a.damage;
      const bDmg = b.damage;
      a.hp -= bDmg;
      b.hp -= aDmg;
      if (a.hp <= 0) a.dead = true;
      if (b.hp <= 0) b.dead = true;
      if (!a.dead) { (a.collidedWith = a.collidedWith || new Set()).add(b.id); }
      if (!b.dead) { (b.collidedWith = b.collidedWith || new Set()).add(a.id); }
      if (a.dead) break;
    }
  }
}
