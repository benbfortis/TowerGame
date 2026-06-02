// state.js — single owner of simulation state. Pure model.
// Public surface:
//   createState(map, prevLoadouts?) — build a fresh state from a map; loadouts persist if passed.
//   resetState(state, map)          — mutate `state` back to fresh (preserves identity AND loadouts).
//   getFactory(state, id)           — read a factory by id.
//   setInvasion(state, src, dst)    — set src's targets to [dst]. Used by AI (single target).
//   addInvasion(state, src, dst)    — append dst to src's targets.
//   removeInvasion(state, src, dst) — remove dst from src's targets.
//   toggleInvasion(state, src, dst) — add if absent, remove if present. Used by player drag.
//   clearInvasions(state, src)      — drop all of src's targets.
//   clearInvasion(state, src)       — legacy alias of clearInvasions.
//   checkWinner(state)              — sets state.winner when a base is taken.
//   isContested(state, srcId, dstId) — true if dst also targets src (BOTH arrows exist).
//   popTier(f, config)              — current production tier of factory f (floor(pop/popPerTier)).
//
// v1.6 additions:
//   factory.population              — STOCK. +1 per generation tick. -1 per emit.
//                                     Tier scaling reads this. Drains under multi-arrow load.
//   timeSinceLevelUp REMOVED        — production tier is pop-based, no time component.

import { FACTORY_TUNING } from '../data/factories.js';
import { DEFAULT_LOADOUTS } from '../data/loadouts.js';
import { RANK_COST } from '../data/ranks.js';
import { buildPathInfo } from './reachability.js';

export function createState(map, prevLoadouts) {
  const playerBase = map.nodes.find(n => n.owner === 'player');
  const aiBase = map.nodes.find(n => n.owner === 'ai');
  // v1.21: collect all non-player starting bases (any AI faction).
  const enemyBaseIds = map.nodes
    .filter(n => n.owner && n.owner !== 'player')
    .map(n => n.id);
  const state = {
    config: { ...FACTORY_TUNING },
    factories: map.nodes.map(n => ({
      id: n.id, x: n.x, y: n.y,
      owner: n.owner,
      rank: n.rank || 'light',
      // v1.9: neutrals start at pop=0. v1.11: bases (owned at game-start) start at startingBasePopulation.
      population: n.owner ? FACTORY_TUNING.startingBasePopulation : 0,
      emitTimer: 0,              // v1.20: single spawn timer; each tick drains cost from pop.
      genTimer: 0,               // v1.18 legacy (no longer used by v1.20 tick).
      timeSinceSpawn: 0,         // legacy field — kept for any stale reader.
      lastForwardEmit: 0,        // v1.10: legacy (forwardUnit no longer called from units.js in v1.14).
      inflowBoost: 0,            // v1.14: recent friendly inflow (cost-equivalents); shortens gen interval.
      outgoingTargetIds: [],
      nextTargetIndex: 0,
    })),
    units: [],
    nextUnitId: 1,
    winner: null,
    elapsed: 0,
    mapWidth: map.width,
    mapHeight: map.height,
    playerBaseId: playerBase ? playerBase.id : null,
    aiBaseId: aiBase ? aiBase.id : null,
    enemyBaseIds,
    loadouts: prevLoadouts
      ? { player: { ...prevLoadouts.player }, ai: { ...prevLoadouts.ai } }
      : { player: { ...DEFAULT_LOADOUTS.player }, ai: { ...DEFAULT_LOADOUTS.ai } },
    mode: 'loadout',
    pathSegments: null,
    pathReach: null,
    deniedFlash: null,
    terrainRegions: map.terrainRegions || [],
  };
  buildPathInfo(state, state.terrainRegions);
  return state;
}

export function resetState(state, map) {
  const prevLoadouts = state.loadouts;
  const fresh = createState(map, prevLoadouts);
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh);
}

export function getFactory(state, id) {
  for (const f of state.factories) if (f.id === id) return f;
  return null;
}

export function setInvasion(state, srcId, dstId) {
  const src = getFactory(state, srcId);
  if (!src) return false;
  if (!dstId || srcId === dstId) { src.outgoingTargetIds = []; src.nextTargetIndex = 0; return true; }
  const dst = getFactory(state, dstId);
  if (!dst) return false;
  src.outgoingTargetIds = [dstId];
  src.nextTargetIndex = 0;
  return true;
}

export function addInvasion(state, srcId, dstId) {
  const src = getFactory(state, srcId);
  if (!src) return false;
  if (!dstId || srcId === dstId) return false;
  if (!getFactory(state, dstId)) return false;
  if (src.outgoingTargetIds.includes(dstId)) return false;
  src.outgoingTargetIds.push(dstId);
  return true;
}

export function removeInvasion(state, srcId, dstId) {
  const src = getFactory(state, srcId);
  if (!src) return false;
  const before = src.outgoingTargetIds.length;
  src.outgoingTargetIds = src.outgoingTargetIds.filter(id => id !== dstId);
  if (src.outgoingTargetIds.length > 0) {
    src.nextTargetIndex = src.nextTargetIndex % src.outgoingTargetIds.length;
  } else {
    src.nextTargetIndex = 0;
  }
  return src.outgoingTargetIds.length !== before;
}

export function toggleInvasion(state, srcId, dstId) {
  const src = getFactory(state, srcId);
  if (!src) return false;
  if (src.outgoingTargetIds.includes(dstId)) {
    return removeInvasion(state, srcId, dstId);
  }
  return addInvasion(state, srcId, dstId);
}

export function clearInvasions(state, srcId) {
  const src = getFactory(state, srcId);
  if (!src) return;
  src.outgoingTargetIds = [];
  src.nextTargetIndex = 0;
}

export function clearInvasion(state, srcId) {
  clearInvasions(state, srcId);
}

export function checkWinner(state) {
  if (state.winner) return;
  const pb = state.playerBaseId ? getFactory(state, state.playerBaseId) : null;
  if (pb && pb.owner !== 'player') { state.winner = 'ai'; return; }
  // v1.21: player wins when ALL designated enemy bases are no longer owned by
  // any non-player faction (i.e. captured by player or wiped to neutral).
  const enemiesRemaining = (state.enemyBaseIds || []).some(id => {
    const f = getFactory(state, id);
    return f && f.owner && f.owner !== 'player';
  });
  if (!enemiesRemaining) state.winner = 'player';
}

// v1.6: contested edge — both factories have each other in their outgoingTargetIds.
export function isContested(state, srcId, dstId) {
  const dst = getFactory(state, dstId);
  if (!dst) return false;
  if (!dst.outgoingTargetIds) return false;
  return dst.outgoingTargetIds.includes(srcId);
}

// v1.10: production tier is step-function on pop, scaled by RANK_COST.
// Each tier requires popPerTier × rank-cost-equivalents of pop. So heavy needs
// 10 × 8 = 80 raw pop for tier 1, medium 10 × 3 = 30, light 10 × 1 = 10.
// This removes the v1.9 architect warning W1 where heavies tier in 9s vs
// lights in 15s — now all ranks tier at the same "10 own-units-worth" rate.
export function popTier(f, config) {
  const cost = RANK_COST[f.rank] || 1;
  const per = (config.popPerTier || 10) * cost;
  return Math.max(0, Math.floor(f.population / per));
}
