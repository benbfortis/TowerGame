// store.js — central data store. All game code imports from here, not from
// individual data files. Provides the same exported names as the old .js files.
// Vite HMR patches JSON objects in-place on file change — no page reload needed
// for tuning edits. Object references stay stable across re-evaluations.

import factoriesRaw  from './factories.json';
import ranksRaw      from './ranks.json';
import unitsRaw      from './units.json';
import unitTypesRaw  from './unitTypes.json';
import terrainRaw    from './terrain.json';
import loadoutsRaw   from './loadouts.json';
import scaleRaw      from './scale.json';
import vfxRaw        from './vfx.json';
import versionRaw    from './version.json';

function deepReplace(target, source) {
  const keys = new Set([...Object.keys(target), ...Object.keys(source)]);
  for (const k of keys) {
    if (!(k in source)) {
      delete target[k];
    } else if (source[k] !== null && typeof source[k] === 'object' && !Array.isArray(source[k])
               && typeof target[k] === 'object' && target[k] !== null) {
      deepReplace(target[k], source[k]);
    } else {
      target[k] = source[k];
    }
  }
}

// ── Persist mutable objects across HMR re-evaluations ───────────────────────
const hd = import.meta.hot?.data ?? {};

function init(key, raw) {
  if (!hd[key]) hd[key] = JSON.parse(JSON.stringify(raw));
  return hd[key];
}

// ── Mutable exported objects ─────────────────────────────────────────────────

export const FACTORY_TUNING = init('FACTORY_TUNING', factoriesRaw);

export const RANKS                  = init('RANKS', ranksRaw.RANKS);
export const RANK_GEN_INTERVAL_SEC  = init('RANK_GEN_INTERVAL_SEC',  ranksRaw.genIntervalSec);
export const RANK_UNIT_SPEED        = init('RANK_UNIT_SPEED',        ranksRaw.unitSpeed);
export const RANK_DAMAGE            = init('RANK_DAMAGE',            ranksRaw.damage);
export const RANK_UNIT_HP           = init('RANK_UNIT_HP',           ranksRaw.hp);
export const RANK_UNIT_RADIUS       = init('RANK_UNIT_RADIUS',       ranksRaw.visualRadius);
export const RANK_COST              = init('RANK_COST',              ranksRaw.cost);
export const RANK_MAX_POP           = init('RANK_MAX_POP',           ranksRaw.maxPop);
export const RANK_FORWARD_COOLDOWN_SEC = init('RANK_FORWARD_COOLDOWN_SEC', ranksRaw.forwardCooldownSec);

export const UNITS      = init('UNITS',      unitsRaw);
export const UNIT_TYPES = init('UNIT_TYPES', unitTypesRaw);

export const TERRAIN_TYPES     = init('TERRAIN_TYPES',     terrainRaw.types);
export const TERRAIN_EFFECTS   = init('TERRAIN_EFFECTS',   terrainRaw.effects);
export const TERRAIN_RENDER    = init('TERRAIN_RENDER',    terrainRaw.render);
export const TERRAIN_LOS_BLOCKS = init('TERRAIN_LOS_BLOCKS', terrainRaw.losBlocks);

export const DEFAULT_LOADOUTS = init('DEFAULT_LOADOUTS', {
  player: loadoutsRaw.player,
  ai:     loadoutsRaw.ai,
  yellow: loadoutsRaw.yellow,
  green:  loadoutsRaw.green,
});
export const AI_FACTIONS = init('AI_FACTIONS', loadoutsRaw.AI_FACTIONS);

export const GAME_SCALE = scaleRaw.GAME_SCALE;

export const VFX = init('VFX', vfxRaw);

export const VERSION       = versionRaw.VERSION;
export const VERSION_LABEL = 'v' + versionRaw.VERSION;

// ── Helper functions (previously in units.js) ────────────────────────────────

export function listUnitsByRank(rank) {
  return Object.values(UNITS).filter(u => u.rank === rank);
}

export function getUnit(id) {
  return UNITS[id] || null;
}

// ── Vite HMR ─────────────────────────────────────────────────────────────────

if (import.meta.hot) {
  import.meta.hot.accept('./factories.json', (m) => {
    if (m?.default) deepReplace(FACTORY_TUNING, m.default);
  });
  import.meta.hot.accept('./ranks.json', (m) => {
    if (!m?.default) return;
    const r = m.default;
    deepReplace(RANK_GEN_INTERVAL_SEC,     r.genIntervalSec);
    deepReplace(RANK_UNIT_SPEED,           r.unitSpeed);
    deepReplace(RANK_DAMAGE,              r.damage);
    deepReplace(RANK_UNIT_HP,             r.hp);
    deepReplace(RANK_UNIT_RADIUS,         r.visualRadius);
    deepReplace(RANK_COST,               r.cost);
    deepReplace(RANK_MAX_POP,            r.maxPop);
    deepReplace(RANK_FORWARD_COOLDOWN_SEC, r.forwardCooldownSec);
  });
  import.meta.hot.accept('./units.json', (m) => {
    if (m?.default) deepReplace(UNITS, m.default);
  });
  import.meta.hot.accept('./unitTypes.json', (m) => {
    if (m?.default) deepReplace(UNIT_TYPES, m.default);
  });
  import.meta.hot.accept('./terrain.json', (m) => {
    if (!m?.default) return;
    deepReplace(TERRAIN_EFFECTS,    m.default.effects);
    deepReplace(TERRAIN_RENDER,     m.default.render);
    deepReplace(TERRAIN_LOS_BLOCKS, m.default.losBlocks);
  });
  import.meta.hot.accept('./loadouts.json', (m) => {
    if (!m?.default) return;
    deepReplace(DEFAULT_LOADOUTS, {
      player: m.default.player, ai: m.default.ai,
      yellow: m.default.yellow, green: m.default.green,
    });
  });
  import.meta.hot.accept('./vfx.json', (m) => {
    if (m?.default) deepReplace(VFX, m.default);
  });
}
