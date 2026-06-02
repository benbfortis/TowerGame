// ai.js — opponent brain. Lives in model: it is an autonomous in-sim agent.
// v1.3: terrain-aware. AI skips targets it cannot reach; penalises slow paths.
// Public surface unchanged: tickAi returns [{srcId, dstId|null}, ...].

import { pathReachability } from './reachability.js';
import { popTier } from './state.js';

export function createAi() { return { timer: 0 }; }
export function resetAi(ai) { ai.timer = 0; }

export function tickAi(ai, state, dt) {
  if (state.winner) return [];
  ai.timer += dt;
  if (ai.timer < state.config.aiReplanEverySec) return [];
  ai.timer = 0;
  const decisions = [];
  // v1.21: every non-player owned factory acts as an AI. Same brain per faction;
  // a faction's factories only consider NON-same-faction factories as targets.
  for (const f of state.factories) {
    if (!f.owner || f.owner === 'player') continue;
    const target = pickTarget(state, f);
    decisions.push({ srcId: f.id, dstId: target ? target.id : null });
  }
  return decisions;
}

function pickTarget(state, src) {
  let best = null;
  let bestScore = -Infinity;
  for (const f of state.factories) {
    if (f.id === src.id) continue;
    if (f.owner === src.owner) continue;  // v1.21: skip same-faction friends
    const reach = pathReachability(state, src.id, f.id);
    if (reach === 'blocked') continue;            // skip unreachable
    const dx = f.x - src.x, dy = f.y - src.y;
    const dist = Math.hypot(dx, dy);
    // v1.7: defence is just population (vitality + tier currency, one metric).
    const defence = f.population + (f.owner ? popTier(f, state.config) * state.config.aiLevelWeight : 0);
    const baseBonus = (f.id === state.playerBaseId) ? state.config.aiBaseBonus : 0;
    const penaltyMul = reach === 'penalised' ? state.config.aiPenaltyMul : 1.0;  // slow paths cost more
    const score = -defence - dist * state.config.aiDistDecay * penaltyMul + baseBonus;
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return best;
}
