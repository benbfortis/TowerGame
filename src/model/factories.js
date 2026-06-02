// factories.js — factory lifecycle: population, pop-tiered generation, capture, forwarding.
// v1.6: gen tick = +1 pop, then emit one per outgoing arrow, draining pop.
// v1.7: factory.hp removed — pop IS vitality.
// v1.8: forwardUnit() — pass-through emit on friendly arrival. Units arriving at a
//       factory with outgoing arrows are re-emitted immediately (converted to dst's
//       rank + loadout) instead of being absorbed as +pop. Pop is NOT touched by
//       forwarding — chains of friendly routes preserve full production tier.
//
// Public surface:
//   tickFactories(state, dt) — advance pop-driven generation across all factories.
//   onCaptured(f, newOwner, state) — flip ownership, reset stats, drop in-flight units.
//   forwardUnit(state, src) — emit one unit from src to its next round-robin outgoing
//                             target (rank-converted). Used by units.js on friendly
//                             arrival when dst has outgoing arrows.

import { getFactory, popTier } from './state.js';
import { RANK_GEN_INTERVAL_SEC, RANK_UNIT_SPEED, RANK_DAMAGE, RANK_UNIT_HP, RANK_UNIT_RADIUS, RANK_COST, RANK_FORWARD_COOLDOWN_SEC, RANK_MAX_POP } from '../data/ranks.js';
import { GAME_SCALE } from '../data/scale.js';
import { UNITS } from '../data/units.js';

export function tickFactories(state, dt) {
  const tau = state.config.inflowDecayTauSec || 4.0;
  const inflowDecayMul = Math.exp(-dt / tau);
  for (const f of state.factories) {
    // v1.14: inflowBoost decays every frame (whether or not the factory is owned).
    if (f.inflowBoost && f.inflowBoost > 0) {
      f.inflowBoost *= inflowDecayMul;
      if (f.inflowBoost < 0.01) f.inflowBoost = 0;
    }
    if (!f.owner) continue;

    // v1.25: pop ambiently grows EVERY tick (+cost, capped at max). On top of
    // that, factories with outgoing arrows ALSO drain via emit (per v1.20).
    // Net per tick:
    //   0 arrows  → +cost  (passive growth)
    //   1 arrow   →  0     (steady — gen replaces emit)
    //   2+ arrows → +cost − (N × cost) = negative (drains)
    const interval = currentGenInterval(state, f);
    const cost = RANK_COST[f.rank] ?? 1;
    const maxPop = RANK_MAX_POP[f.rank] ?? 999;
    f.emitTimer += dt;
    while (f.emitTimer >= interval) {
      f.emitTimer -= interval;
      // Ambient gen first — always grows by cost (capped).
      f.population = Math.min(maxPop, f.population + cost);
      // Then emit per arrow if any (drains cost per emit).
      if (f.outgoingTargetIds && f.outgoingTargetIds.length > 0) {
        emitOnePerArrow(state, f);
      }
    }
  }
}

// One emit pass: try to emit one unit per outgoing arrow in round-robin order.
function emitOnePerArrow(state, f) {
  const cost = RANK_COST[f.rank] ?? 1;
  const n = f.outgoingTargetIds.length;
  if (n === 0) return;
  for (let i = 0; i < n; i++) {
    if (f.population < cost) break;
    const idx = (f.nextTargetIndex + i) % n;
    const dstId = f.outgoingTargetIds[idx];
    if (spawnUnit(state, f, dstId)) {
      f.population -= cost;
    }
  }
  f.nextTargetIndex = (f.nextTargetIndex + 1) % n;
}

// v1.9 cost-aware gen step. Each rank generates +cost pop per gen tick and
// v1.18: tickOneGenStep removed. tickFactories now uses two timers (gen + emit)
// where emit runs slightly faster than gen so output > input.

function currentGenInterval(state, f) {
  const base = RANK_GEN_INTERVAL_SEC[f.rank] ?? state.config.baseGenIntervalSec;
  const tier = popTier(f, state.config);
  // Pop-tier rate bonus stacks ADDITIVELY with the v1.14 inflow-rate boost.
  // Net rate multiplier = 1 + tierBonus + inflowBoost × inflowBoostFactor.
  const tierBonus = tier * state.config.popTierRateBonus;
  const inflowBonus = (f.inflowBoost || 0) * (state.config.inflowBoostFactor || 0);
  const rateMul = 1 + tierBonus + inflowBonus;
  return base / rateMul;
}

function spawnUnit(state, f, dstId) {
  const dst = getFactory(state, dstId);
  if (!dst) return false;
  const unitId = state.loadouts?.[f.owner]?.[f.rank] || null;
  const unitDef = unitId ? UNITS[unitId] : null;
  const pathfinds = !!unitDef?.pathfinds;
  // v1.13: pathfinding-or-not is PER-UNIT. Pathfinding units use the A*
  // polyline; default units take the straight src→dst line and are blocked
  // if that line crosses a terrain blocker for their rank.
  let waypoints;
  if (pathfinds) {
    waypoints = state.pathfindingWaypoints?.[f.rank]?.[f.id]?.[dstId];
    if (!waypoints || waypoints.length < 2) return false;
  } else {
    const sr = state.straightReach?.[f.rank]?.[f.id]?.[dstId];
    if (sr === 'blocked') return false;
    waypoints = [{ x: f.x, y: f.y }, { x: dst.x, y: dst.y }];
  }
  state.units.push({
    id: state.nextUnitId++,
    type: unitId || 'standard',
    rank: f.rank,
    srcId: f.id,
    dstId,
    owner: f.owner,
    waypoints,
    segmentIdx: 0,
    segmentT: 0,
    arrived: false,
    x: f.x, y: f.y,
    t: 0,
    dead: false,
    // v1.13: per-unit attack/hp, with rank-default fallback.
    hp:     unitDef?.hp     ?? RANK_UNIT_HP[f.rank]    ?? 1,
    damage: unitDef?.attack ?? RANK_DAMAGE[f.rank]     ?? 1,
    // v1.20: ranged units have reduced FACTORY-arrival damage. Defaults to
    // the unit's attack when not specified (melee units siege as expected).
    factoryDamage: unitDef?.factoryDamage ?? unitDef?.attack ?? RANK_DAMAGE[f.rank] ?? 1,
    baseSpeed: RANK_UNIT_SPEED[f.rank] ?? state.config.unitSpeed,
    radius:    RANK_UNIT_RADIUS[f.rank] ?? state.config.unitRadius,
    color: unitDef?.color || null,
    glyph: unitDef?.glyph || null,
    range: unitDef?.range || 0,
    fireCooldownSec: unitDef?.fireCooldownSec || 0,
    fireTimer: 0,
  });
  return true;
}

// v1.9 cost-aware + v1.10 cooldown-gated forwarding.
// Emits one unit from `src` to its next round-robin outgoing target (converted
// to src's rank + loadout). Requires BOTH:
//   - pop >= cost
//   - state.elapsed - src.lastForwardEmit >= RANK_FORWARD_COOLDOWN_SEC[src.rank]
// Pays `cost` from pop and updates `lastForwardEmit` on success.
// Returns true if a unit was emitted; false if pop or cooldown blocked it.
// Caller (units.js) loops to burst-emit, but the cooldown caps how many
// successive bursts can fire in real time.
export function forwardUnit(state, src) {
  const n = src.outgoingTargetIds?.length || 0;
  if (n === 0) return false;
  const cost = RANK_COST[src.rank] ?? 1;
  if (src.population < cost) return false;
  const cooldown = RANK_FORWARD_COOLDOWN_SEC[src.rank] ?? 0;
  if (state.elapsed - (src.lastForwardEmit || 0) < cooldown) return false;
  const idx = src.nextTargetIndex % n;
  const dstId = src.outgoingTargetIds[idx];
  src.nextTargetIndex = (src.nextTargetIndex + 1) % n;
  if (spawnUnit(state, src, dstId)) {
    src.population -= cost;
    src.lastForwardEmit = state.elapsed;
    return true;
  }
  return false;
}

export function onCaptured(f, newOwner, state) {
  f.owner = newOwner;
  // v1.9: capture seed = "the 1 unit that captured it becomes the new owner's
  // first stored unit." v1.24: scales with GAME_SCALE so it stays proportional
  // to base seed + max-pop values.
  f.population = 1 * GAME_SCALE;
  f.genTimer = 0;
  f.emitTimer = 0;
  f.timeSinceSpawn = 0;
  f.inflowBoost = 0;             // v1.14: fresh capture has no inflow history.
  f.outgoingTargetIds = [];
  f.nextTargetIndex = 0;
  // v1.19: in-flight units from this factory are NO LONGER killed on capture.
  // They retain their original owner and complete their journey — arriving as
  // friendly (+pop to old-owner factory) or enemy (damage to other-owner
  // factory) based on dst's owner at the moment of arrival. Lets pre-spawned
  // units carry the prior owner's commitment to its target.
}
