// input.js — drag-to-invade + slash-to-cancel pointer/touch handling.
// Spec: .architecture-audit/input-feel-spec-v1.3.md (input-handler-agent).
//
// Public surface:
//   attachInput(canvas, state, viewState, mapW, mapH) — wire pointer events.
//
// Two gesture modes (set in down()):
//   'invade' — pointerdown landed on a player-owned factory. Drag to a target factory
//              to toggle an invasion. Pre-drag reachability tints + snap preview shown.
//   'slash'  — pointerdown elsewhere. No preview; finger path cancels every PLAYER
//              invasion line it crosses (orientation test, see actions.js).
//
// In BOTH modes, the per-frame drag-tick segment is fed to
// cancelInvasionsCrossingSegment, so a drag from a factory can ALSO slash-cancel
// other player lines (including the source factory's own lines — v1.5 fix).
//
// Drag-commit semantics for 'invade' mode:
//   - snapped, reachability ∈ {'free','penalised'}  → toggleInvasion (commit).
//   - snapped, reachability === 'blocked'           → no-op + denied flash.
//   - released on source factory                    → clearInvasions.
//   - released in empty space                       → silent cancel.

import { viewportToMap } from '../view/canvas.js';
import { addInvasion, clearInvasions, cancelInvasionsCrossingSegment } from './actions.js';
import { pathReachability } from '../model/reachability.js';
import { getFactory } from '../model/state.js';
import { VFX } from '../data/store.js';

export function attachInput(canvas, state, viewState, mapWidth, mapHeight) {
  function pickFactory(clientX, clientY, radius) {
    const { x, y } = viewportToMap(canvas, mapWidth, mapHeight, clientX, clientY);
    let best = null, bestD = Infinity;
    for (const f of state.factories) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d <= radius && d < bestD) { bestD = d; best = f; }
    }
    return { f: best, x, y };
  }

  function lastCoalescedPoint(e) {
    if (e.getCoalescedEvents) {
      const all = e.getCoalescedEvents();
      if (all && all.length) return all[all.length - 1];
    }
    return e;
  }

  function down(e) {
    if (state.winner || state.mode !== 'playing') return;
    if (e.button !== undefined && e.button !== 0) return;
    const pick = pickFactory(e.clientX, e.clientY, state.config.factoryPickupRadius);
    const { x, y } = pick;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* no-op */ }

    if (pick.f && pick.f.owner === 'player') {
      // INVADE mode — set a source, enable preview + snap.
      viewState.drag = {
        active: true,
        mode: 'invade',
        srcId: pick.f.id,
        x, y,
        snappedTargetId: null,
        reachability: null,
        pointerId: e.pointerId,
      };
      // haptics.tick('verylight'); audio.play('drag-start');
    } else {
      // SLASH mode — no source factory; the finger path cancels crossed player lines.
      viewState.drag = {
        active: true,
        mode: 'slash',
        srcId: null,
        x, y,
        snappedTargetId: null,
        reachability: null,
        pointerId: e.pointerId,
      };
      // haptics.tick('verylight'); audio.play('slash-start');
    }
  }

  function move(e) {
    const d = viewState.drag;
    if (!d || !d.active || d.pointerId !== e.pointerId) return;
    e.preventDefault();
    const p = lastCoalescedPoint(e);
    const prevX = d.x, prevY = d.y;
    const { x, y } = viewportToMap(canvas, mapWidth, mapHeight, p.clientX, p.clientY);
    d.x = x; d.y = y;

    // Slash-cancel: fire in BOTH modes, but v1.13 adds an EXCLUSION ZONE near
    // the drag's source factory so the early "drag out of the node" segment
    // can't accidentally cancel another arrow originating from that source.
    let allowCancel = true;
    if (d.mode === 'invade' && d.srcId) {
      const src = getFactory(state, d.srcId);
      if (src) {
        const distFromSrc = Math.hypot(x - src.x, y - src.y);
        const minSlashDist = (state.config.factoryRadius || 36) * 2;  // ~72px gate
        if (distFromSrc < minSlashDist) allowCancel = false;
      }
    }
    if (allowCancel) {
      const cancelled = cancelInvasionsCrossingSegment(state, prevX, prevY, x, y);
      if (cancelled > 0) {
        // audio.play('invasion-cancelled'); haptics.tick('medium');
      }
    }

    // Snap detection only in invade mode.
    if (d.mode === 'invade') {
      const snap = pickFactory(p.clientX, p.clientY, state.config.targetSnapRadius);
      const newSnappedId = (snap.f && snap.f.id !== d.srcId) ? snap.f.id : null;
      const newReach = newSnappedId ? pathReachability(state, d.srcId, newSnappedId) : null;

      const prevSnap = d.snappedTargetId;
      const prevReach = d.reachability;
      d.snappedTargetId = newSnappedId;
      d.reachability = newReach;

      if (newSnappedId !== prevSnap || newReach !== prevReach) {
        if (newSnappedId && newSnappedId !== prevSnap) {
          if (newReach === 'free') {
            // audio.play('snap-on-free');     haptics.tick('light');
          } else if (newReach === 'penalised') {
            // audio.play('snap-on-penalised'); haptics.tick('light');
          } else if (newReach === 'blocked') {
            // audio.play('snap-on-blocked');   haptics.error('double');
          }
        } else if (!newSnappedId && prevSnap) {
          // audio.play('snap-off');           haptics.tick('verylight');
        }
      }
    }
  }

  function up(e) {
    const d = viewState.drag;
    if (!d || !d.active || d.pointerId !== e.pointerId) return;
    const mode = d.mode;
    const srcId = d.srcId;
    const snappedId = d.snappedTargetId;
    const reach = d.reachability;
    d.active = false;
    d.snappedTargetId = null;
    d.reachability = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* no-op */ }

    if (mode === 'slash') {
      // Slash gesture: no commit. The cancels already happened during move().
      return;
    }

    // INVADE-mode commit semantics.
    if (snappedId && reach === 'blocked') {
      // audio.play('commit-denied'); haptics.error('strong');
      state.deniedFlash = { factoryId: snappedId, until: performance.now() + VFX.deniedFlashMs };
      return;
    }
    if (snappedId) {
      // v1.13: ADD-only on commit (was toggle in v1.5–v1.12). Drag-twice no
      // longer cancels the first path — explicit slash or release-on-source
      // are the only cancel gestures now.
      // audio.play('invasion-commit'); haptics.tick('medium');
      addInvasion(state, srcId, snappedId);
      return;
    }
    const hit = pickFactory(e.clientX, e.clientY, state.config.factoryPickupRadius);
    if (hit.f && hit.f.id === srcId) {
      // audio.play('clear-invasions'); haptics.tick('medium');
      clearInvasions(state, srcId);
    }
    // else: empty space → preserve existing targets.
  }

  function cancel(e) {
    const d = viewState.drag;
    if (!d || !d.active || d.pointerId !== e.pointerId) return;
    d.active = false;
    d.snappedTargetId = null;
    d.reachability = null;
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
