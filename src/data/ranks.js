// ranks.js — per-rank tuning tables. Data only.
// Sourced from .architecture-audit/balance-proposal-v1.3.md (combat-balance-agent).
// Combat-balance work edits THIS file. Logic stays in model/.

import { GAME_SCALE } from './scale.js';

export const RANKS = ['light', 'medium', 'heavy'];

// v1.24: all rate + pop scales derived from GAME_SCALE in scale.js.
// Base intervals (3.0/5.0/9.0) divided by GAME_SCALE → faster spawn at high scale.
const BASE_GEN_INTERVAL_SEC = { light: 3.0, medium: 5.0, heavy: 9.0 };
export const RANK_GEN_INTERVAL_SEC = {
  light:  BASE_GEN_INTERVAL_SEC.light  / GAME_SCALE,
  medium: BASE_GEN_INTERVAL_SEC.medium / GAME_SCALE,
  heavy:  BASE_GEN_INTERVAL_SEC.heavy  / GAME_SCALE,
};

// Base pixels-per-second along a clean path. Terrain speedMul layers on top.
export const RANK_UNIT_SPEED = {
  light:  120,
  medium: 85,
  heavy:  55,
};

// v1.17: damage equals cost (operator: "heavies take 8 to make → they take off 8").
// Mutual cost-symmetry: 8 lights destroy 1 heavy, 3 lights destroy 1 medium, etc.
export const RANK_DAMAGE = {
  light:  1,
  medium: 3,
  heavy:  8,
};

// Hit-points for the mutual-destruction collision system. Default-rank units
// have hp == damage so two identical defaults mutually-kill on contact.
export const RANK_UNIT_HP = {
  light:  1,
  medium: 3,
  heavy:  8,
};

// Visual radius per rank (heavier reads bigger). Render-time fallback.
export const RANK_UNIT_RADIUS = {
  light:  5,
  medium: 7,
  heavy:  9,
};

// v1.9: unit-equivalent cost. Pop is stored in cost-units now.
//   light = 1, medium = 3, heavy = 8.
//   - Generation tick: factory adds +cost to pop, then emits one of its own
//     rank per outgoing arrow, each emit costing -cost.
//   - Friendly arrival: pop += arriving unit's cost. Burst-forward while
//     pop >= dst's cost.
//   - Enemy arrival: still -1 per hit (literal v1.7 "takes one off"),
//     capture on pop=0 sets pop=1.
//   "Sending 3 lights to a medium factory" = +3 pop → 1 medium emitted.
//   "Sending 1 heavy to a light factory" = +8 pop → 8 lights burst-emitted.
export const RANK_COST = {
  light:  1,
  medium: 3,
  heavy:  8,
};

// v1.11: max population per rank (operator: "max factory level for light is 10,
// med is 30 and heavy is 80"). Generation and friendly arrival both clamp at
// these caps — prevents runaway stockpiling. With popPerTier=10 and the cost
// scaling, every rank caps at exactly tier 1 (+10% rate) at full pop.
// v1.24: derived from BASE × GAME_SCALE.
const BASE_RANK_MAX_POP = { light: 10, medium: 30, heavy: 80 };
export const RANK_MAX_POP = {
  light:  BASE_RANK_MAX_POP.light  * GAME_SCALE,
  medium: BASE_RANK_MAX_POP.medium * GAME_SCALE,
  heavy:  BASE_RANK_MAX_POP.heavy  * GAME_SCALE,
};

// v1.10: per-rank minimum seconds between forward emits (chain-throughput cap).
// Pop alone isn't enough to fire — forwardUnit also requires the cooldown to
// have elapsed since the factory's last forward emit. This caps the burst
// compression that v1.9 enabled (heavy chain receiving 8 lights and instantly
// firing 1 heavy regardless of own gen rate). Rough scale: ~½ of gen interval.
export const RANK_FORWARD_COOLDOWN_SEC = {
  light:  0.3,
  medium: 0.5,
  heavy:  1.0,
};
