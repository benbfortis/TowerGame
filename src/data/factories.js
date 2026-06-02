// factories.js — factory + unit + AI tuning knobs. Data only.
// Combat-balance work edits THIS file. Logic stays in model/.

import { GAME_SCALE } from './scale.js';

// v1.24: pop knobs derived from BASE × GAME_SCALE (scale.js).
const BASE_STARTING_BASE_POP = 12;
const BASE_POP_PER_TIER = 10;

export const FACTORY_TUNING = {
  // v1.7: factory HP REMOVED. Population stores cost-equivalents (v1.9).
  //   Enemy hit: pop -= 1. Hit on pop=0 = capture (pop set to 1).
  //   Friendly arrival: pop += unit's cost (1/3/8); burst-forward as dst can afford.
  // v1.9: capture seed is hardcoded to 1 in onCaptured (literal "1 unit took it").
  //       Neutrals start at pop=0 (no occupants). startingPopulation removed.
  // v1.11: bases (factories owned at game-start) get a defensive seed pop so
  //        the first enemy unit doesn't instantly capture them. Neutrals + captures
  //        still follow the v1.9 rules (pop=0 / pop=1).
  startingBasePopulation: BASE_STARTING_BASE_POP * GAME_SCALE,

  // Levelling — production tier driven by factory.population.
  maxLevel: 99,                 // cap on tiers (population can grow unboundedly otherwise)
  popPerTier: BASE_POP_PER_TIER * GAME_SCALE,
  popTierRateBonus: 0.50,       // v1.16: each tier adds +50% production rate (was 10%)

  // Generation cadence — v1.3 SUPERSEDED per-rank by data/ranks.js RANK_GEN_INTERVAL_SEC.
  // Kept here as a defensive fallback for any factory lacking an explicit rank.
  baseGenIntervalSec: 2.0,
  // v1.6: genIntervalPerLevel REMOVED (was the old 0.85 per-level multiplier).
  // Production scaling now lives in popPerTier + popTierRateBonus above.

  // Units — v1.3 SUPERSEDED per-rank by data/ranks.js RANK_UNIT_SPEED. Fallback only.
  unitSpeed: 90,
  unitRadius: 6,

  // Visual / hit-test
  factoryRadius: 36,        // drawn body
  factoryPickupRadius: 58,  // pointerdown lands here to start a drag (bigger than body)
  targetSnapRadius: 72,     // pointerup within this of any factory commits to it (v1.3: 64→72 per input-handler-agent)

  // AI cadence + target-scoring weights (combat-balance-agent territory)
  aiReplanEverySec: 1.5,
  aiLevelWeight: 2,      // how heavily each defender level discourages attack
  aiBaseBonus: 3,        // preference bias toward the player base
  aiDistDecay: 0.005,    // per-pixel penalty for far targets
  aiPenaltyMul: 1.5,     // multiplier on dist-decay when path is terrain-penalised

  // v1.14: friendly inflow rate-boost (replaces v1.8 burst-forward).
  // factory.inflowBoost is bumped on each friendly arrival by the arriving
  // unit's cost, then decays exponentially. Effective gen interval is
  // base_interval / (1 + inflowBoost × inflowBoostFactor).
  // v1.17: factor 0.10 → 0.50 so inflow is VISIBLY consummate with output.
  // 1 cost/sec sustained inflow → steady-state boost ≈ 2.0 → effective rate ×3.
  // 1 heavy arrival → instant boost = 4.0 → effective rate ×5 for ~3s.
  inflowBoostFactor: 0.50,
  inflowDecayTauSec: 4.0,   // exponential decay time-constant; halves every ~2.8s

  // v1.20: passive pop generation REMOVED. Each emit drains `cost` from pop;
  // pop refills from friendly inflows and capture/seed values only. Factories
  // are no longer infinite producers — they convert stockpile + inflow into
  // outflow. emitVsGenRatio (v1.18) removed: spawn interval IS the rank's
  // RANK_GEN_INTERVAL_SEC, scaled by tier + inflow boost.
};
