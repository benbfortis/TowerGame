// tick.js — frame orchestration. Owned by controller layer.
// Public surface:
//   createTick(state, ai) — returns a `tick(dt)` function for game.js to call each frame.
//
// ── Tick-order contract (BINDING — do not reorder without an ADR) ──────────
//   1. AI decisions     — pick targets based on current state.
//   2. Factories        — level-up + spawn units toward current targets.
//   3. Units            — move, collide, arrive, damage / capture.
//   4. Winner check     — detect end condition AFTER all state mutations.
//
//   Why the order is load-bearing:
//   - AI-before-factories so freshly-chosen targets drive THIS frame's spawns.
//   - Factories-before-units so new spawns participate in this frame's movement.
//   - Units-before-winner-check so captures are detected the moment they happen.
//
//   See ARCHITECTURE.md §6 "Frame tick order".
// ───────────────────────────────────────────────────────────────────────────

import { tickFactories } from '../model/factories.js';
import { tickUnits } from '../model/units.js';
import { tickAi } from '../model/ai.js';
import { checkWinner } from '../model/state.js';
import { setInvasion, clearInvasion } from './actions.js';

export function createTick(state, ai) {
  return function tick(dt) {
    if (state.winner) return;
    state.elapsed += dt;

    // Transient visual-state expiry (denied-flash is written by input.js, must be
    // cleared by the controller — NOT by render.js, which is read-only by contract).
    if (state.deniedFlash && performance.now() >= state.deniedFlash.until) {
      state.deniedFlash = null;
    }
    // v1.12: expire ranged-fire shot flashes (written by units.js tickRangedFire).
    if (state.shots && state.shots.length > 0) {
      state.shots = state.shots.filter(s => s.until > state.elapsed);
    }

    // 1. AI decisions — returned as a list, applied via the shared action layer.
    const decisions = tickAi(ai, state, dt);
    for (const d of decisions) {
      if (d.dstId) setInvasion(state, d.srcId, d.dstId);
      else clearInvasion(state, d.srcId);
    }

    // 2-4.
    tickFactories(state, dt);
    tickUnits(state, dt);
    checkWinner(state);
  };
}
