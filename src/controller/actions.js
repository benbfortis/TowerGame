// actions.js — public controller surface. ui/ and input/ go through here.
// Player drag uses toggleInvasion (add on first drag, remove on second).
// AI uses setInvasion (single-target replace). Both paths converge on model/state.
//
// Public surface:
//   setInvasion(state, srcId, dstId)    — replace src's targets with [dstId].
//   addInvasion(state, srcId, dstId)    — append dstId (no-op if present).
//   removeInvasion(state, srcId, dstId) — drop dstId from src's targets.
//   toggleInvasion(state, srcId, dstId) — add if absent, remove if present.
//   clearInvasions(state, srcId)        — drop all of src's targets.
//   clearInvasion(state, srcId)         — alias of clearInvasions (legacy single-name).

import * as State from '../model/state.js';

export function setInvasion(state, srcId, dstId)    { return State.setInvasion(state, srcId, dstId); }
export function addInvasion(state, srcId, dstId)    { return State.addInvasion(state, srcId, dstId); }
export function removeInvasion(state, srcId, dstId) { return State.removeInvasion(state, srcId, dstId); }
export function toggleInvasion(state, srcId, dstId) { return State.toggleInvasion(state, srcId, dstId); }
export function clearInvasions(state, srcId)        { return State.clearInvasions(state, srcId); }
export function clearInvasion(state, srcId)         { return State.clearInvasion(state, srcId); }

// Cancel any PLAYER-owned invasion whose line is crossed by the segment
// (x1,y1)→(x2,y2). v1.5: no source exclusion — the source's own lines are
// cancellable too (orientation-test rejects colinear segments, so a straight
// drag toward the same target does NOT false-cancel itself; only a finger path
// that actually crosses an existing line cancels it).
// Returns the count cancelled (for stub haptic / audio feedback).
export function cancelInvasionsCrossingSegment(state, x1, y1, x2, y2) {
  let cancelled = 0;
  for (const f of state.factories) {
    // MULTIPLAYER: when local-player identity exists, filter by state.localPlayerId
    // instead of the literal 'player' string (architect v1.4 warning).
    if (f.owner !== 'player') continue;
    if (!f.outgoingTargetIds || f.outgoingTargetIds.length === 0) continue;
    // Copy because removeInvasion mutates outgoingTargetIds.
    for (const tid of [...f.outgoingTargetIds]) {
      const dst = State.getFactory(state, tid);
      if (!dst) continue;
      if (segmentsIntersect(x1, y1, x2, y2, f.x, f.y, dst.x, dst.y)) {
        State.removeInvasion(state, f.id, tid);
        cancelled++;
      }
    }
  }
  return cancelled;
}

// Standard 2D segment-segment intersection. Returns true if AB crosses CD
// (proper intersection — touching endpoints don't count toward a cancel).
function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = orient(cx, cy, dx, dy, ax, ay);
  const d2 = orient(cx, cy, dx, dy, bx, by);
  const d3 = orient(ax, ay, bx, by, cx, cy);
  const d4 = orient(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function orient(px, py, qx, qy, rx, ry) {
  return (qx - px) * (ry - py) - (qy - py) * (rx - px);
}
