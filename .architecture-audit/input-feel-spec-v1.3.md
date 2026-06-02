# Input-Feel Spec — Drag-to-Invade v1.3 (terrain + ranks)

**Owner:** `input-handler-agent`
**Status:** Spec, ready for implementer
**Scope:** `src/controller/input.js`, `src/view/render.js` (drag preview / snap ring code only — no factory body or HUD changes)
**Reads:** `src/data/factories.js` (radii), plus the new v1.3 reachability model (terrain polygons, per-rank `blocked` / `speedMul`)
**Does not own:** terrain rendering itself, combat math, factory body art, HUD, sound/haptic systems (call sites only)

---

## TL;DR — top 3 recommendations (also in chat reply)

1. **Adopt pre-drag reachability tinting (Section 4).** The single highest-impact change. The instant the player presses on a source factory, every other factory gets a per-source reachability ring (free / slow / blocked). This converts a *guess-then-discover* loop into a *see-then-decide* loop and is what makes terrain feel like a strategic surface instead of a punishment.
2. **Snap to blocked targets but make the commit a no-op with a sharp "denied" feedback flash (Section 2, option A).** Refusing to snap (B) would make blocked factories feel ghostly and ungrabable, which is more frustrating than the rare miscommit. The denied flash teaches the rank/terrain rule in one drag.
3. **Add a `reachability` field to `viewState.drag` populated in `move()` via a new `pathReachability(state, srcId, dstId)` helper (Section 9).** All visual states, all haptic stubs, and the pre-drag tint key off this single computed field. No render-side recomputation.

---

## Section 1 — Drag-state visual taxonomy

The drag preview has a *line* (from source to pointer or snapped target) and an optional *ring* (over the snapped factory). State is driven entirely by `viewState.drag.reachability` (see Section 9).

### State A — Empty space (no snap)

**Reachability:** `null`
**Line:** dashed white, current behaviour preserved.
- Color: `rgba(255,255,255,0.85)` (current `COLOR.preview`)
- Stroke width: `3px`
- Dash: `[8, 6]`
- Glow: none

**Ring:** none.
**Iconography:** none.
**Haptic / sound stub:** none — pure preview.

### State B — Snapped, reachable freely (no terrain crossed, or only neutral terrain)

**Reachability:** `'free'`
**Line:** solid cyan, current snapped behaviour.
- Color: `rgba(126,200,255,0.95)` (current `COLOR.previewSnapped`)
- Stroke width: `4px`
- Dash: solid (`[]`)
- Glow: optional soft cyan halo — `ctx.shadowColor = 'rgba(126,200,255,0.55)'; ctx.shadowBlur = 6;` around the line draw (cheap, single Path2D)

**Ring:** solid cyan, current behaviour.
- Color: `rgba(126,200,255,0.85)` (current `COLOR.snapRing`)
- Stroke width: `3px`
- Radius: `factoryRadius + 6`
- Pulse: **add a 1.2 Hz breathing pulse** — `radius += sin(t * 2π * 1.2) * 2`. Cheap, ~4px peak-to-peak. Sells the "locked on" state.

**Iconography:** none.
**Haptic / sound stub:** `// haptics.tick('snap-on-free')` and `// audio.play('snap-on-free')` on transition into this state from `null`.

### State C — Snapped, reachable but penalised (path crosses one or more speedMul terrains for source rank)

**Reachability:** `'penalised'`
**Line:** solid amber, narrower than free state to signal "valid but compromised."
- Color: `rgba(255,184,77,0.95)` (amber `#ffb84d` at 95% alpha) — chosen because it sits clearly between cyan (free) and red (blocked) on the hue wheel *and* on a deuteranopia-simulated palette
- Stroke width: `3.5px`
- Dash: solid (`[]`) — solid preserves "this commits"
- Glow: amber halo, slightly stronger than free (`shadowBlur = 8`) so the warmth reads even at small sizes

**Ring:** amber, dashed.
- Color: `rgba(255,184,77,0.9)`
- Stroke width: `3px`
- Dash: `[6, 4]` — dashed ring is the secondary cue that says "yes but"
- Radius: `factoryRadius + 6`
- Pulse: same 1.2 Hz breathing.

**Iconography:** small slow-icon ⏳ (or a stylised hourglass / wavy-lines glyph — implementer's choice from existing font) above the target ring at `(target.x, target.y - factoryRadius - 18)`, in the same amber, 12px. Purpose: explains *why* the line is amber even before the player has built terrain literacy.

**Haptic / sound stub:** `// haptics.tick('snap-on-penalised')` and `// audio.play('snap-on-penalised')` on transition into this state — a softer / muffled variant of the free snap sound.

### State D — Snapped, BLOCKED (path crosses a terrain that is blocked for source rank)

**Reachability:** `'blocked'`
**Line:** dashed red — dashed because the commit will not happen; red because deny.
- Color: `rgba(255,91,91,0.95)` (matches existing `COLOR.ai` family — `#ff5b5b` at 95%) so blocked reads as "hostile / refused" using the palette the player already knows
- Stroke width: `3.5px`
- Dash: `[10, 5]` — longer dash than empty-space preview so it's distinct from "you haven't snapped yet"
- Glow: red halo (`shadowBlur = 8`) — must be visible against busy terrain polygons

**Ring:** red, double-stroke X overlay (see Section 8 for accessibility rationale).
- Color: `rgba(255,91,91,0.95)`
- Stroke width: `3px`
- Radius: `factoryRadius + 6`
- **Overlay:** draw a ⊘ symbol — circle outline + 45°-tilted diagonal stroke — across the ring. This is the colorblind-safe denial cue.
- Pulse: **no breathing pulse** — instead a single brief flash (alpha 1.0 → 0.7 over 180ms) when the state is entered. Pulse + flash on the same element is noisy; pick flash for blocked.

**Iconography:** the ⊘ over the ring *is* the iconography; no extra glyph.

**Haptic / sound stub:** `// haptics.error('snap-on-blocked')` (a sharper, double-pulse pattern) and `// audio.play('snap-on-blocked')` on transition into this state.

### Transition rules (all states)

- A drag may pass through all four states fluidly as the pointer moves; transitions are detected by comparing previous frame's `reachability` against current. The transition is what fires the haptic/audio stub, not the steady state.
- `snap-broken` fires once per transition from any snapped state (B/C/D) back to `null`.

---

## Section 2 — Snap behaviour around unreachable targets

**Decision: (A) Snap with blocked visual; pointerup is a no-op with a brief "denied" feedback flash on the target ring.**

### Justification

- **Discoverability beats purity.** If we refuse to snap (B), a blocked factory feels invisible to the drag system. The player drags toward it, sees no ring, releases, sees no feedback — the most likely interpretation is "the input is broken" not "my rank is wrong for this terrain." That is the exact failure mode this v1.3 spec exists to prevent.
- **The penalty for miscommit is trivial.** Toggling a blocked target is a no-op for the model — units never reach. So the cost of "snap and deny" is one wasted pointerup, vs. the cost of "no snap" which is one wasted *understanding event* for every blocked attempt across the player's first session.
- **Option C (snap + hold-to-commit) is the right tool for a different problem** — namely irreversible / costly commits, which this isn't. Toggling a target is already reversible (drag again to detoggle). Adding a hold gate doubles the gesture vocabulary for almost no safety win.

### Behaviour spec

- On pointerup while `reachability === 'blocked'`:
  - **Do NOT** call `toggleInvasion` — early-return.
  - **Do** fire a `// audio.play('commit-denied')` and `// haptics.error('commit-denied')` stub.
  - **Do** post a transient `viewState.deniedFlash = { factoryId, until: now + 350ms }` that the renderer paints as a single bright red ring pulse over the blocked factory. This is the "you tried, it didn't" confirmation.
- The drag itself terminates normally (cleared from `viewState.drag`).
- The source factory's existing outgoing targets are preserved (consistent with the current "release in empty space" semantics — silent cancel of the new target, no destruction of prior state).

---

## Section 3 — Snap behaviour around penalised but reachable targets

**Decision: snap normally, commit normally, but the entire snapped state uses the amber visual treatment from Section 1 (State C).**

### Spec

- `toggleInvasion(state, srcId, snappedId)` is called exactly as today — the model treats penalised the same as free for the purpose of "is this a legal target."
- The signal that the path is slow comes from:
  1. The amber + dashed-ring visual during drag (so the player knows *before* they release).
  2. A softer snap-on sound (Section 7).
  3. (Out of scope for input-feel but worth flagging to the renderer agent:) the resulting **invasion arrow** drawn by `render.js` should ideally pick up amber colouring when the path crosses speedMul terrain. That arrow-state inheritance is a follow-on render task — not in this spec — but the underlying `pathReachability()` helper this spec introduces is the natural data source for it.

### Why no extra commit gesture for penalised

Penalised is the *interesting* design space of v1.3 — "I want to push through the swamp because all the safe routes are taken." Adding friction to that commit punishes the strategic decision. Signal it, don't gate it.

---

## Section 4 — Pre-drag affordance: show reachability at a glance

**Decision: YES, enable it. Highest-leverage change in this spec.**

### Rationale

Without this, the player learns terrain rules by *failing*: drag, release, watch a unit get blocked or trudge through swamp, infer the rule. With this, the player learns terrain rules by *touching*: press on a heavy-rank factory, see three other factories ringed red and two ringed amber, understand "heavy can't cross these blue polygons" within the first interaction.

This converts terrain from a punishment surface into a planning surface, which is the entire reason ranks were added in v1.3.

### Visual

When `viewState.drag.active === true`, every factory **other than the source** gets a thin reachability-tint ring drawn just outside the existing body outline:

- **Free** (`pathReachability(state, srcId, otherId) === 'free'`): ring color `rgba(126,200,255,0.45)`, stroke width `2px`, radius `factoryRadius + 3`. Subtle — it reads as "available" without competing with the active snap ring.
- **Penalised**: ring color `rgba(255,184,77,0.55)`, stroke `2px`, radius `factoryRadius + 3`, dashed `[5, 4]`.
- **Blocked**: ring color `rgba(255,91,91,0.6)`, stroke `2px`, radius `factoryRadius + 3`, with a small ⊘ glyph at `(f.x + factoryRadius, f.y - factoryRadius)` (top-right of the ring, 10px). The glyph guarantees colorblind legibility (Section 8).

**Layering:** these rings are drawn between the invasion-arrow pass and the factory-body pass so they sit under the body but over the arrows. The active snap ring (Section 1) draws on top of everything as it does today.

**Source factory** itself gets a subtle outward pulse-glow during drag (cyan, 1.5 Hz, 4px peak-to-peak) so the player can quickly re-locate the anchor of their drag if their pointer wanders far across the map. This is a small but real touchscreen-ergonomics win.

### Performance

**Precompute at map-load — a per-rank reachability matrix.** Compute `reach[rank][srcId][dstId]` once when the map and terrain are loaded:

- For each ordered factory pair `(src, dst)` and each rank `r`:
  - Walk the straight segment `src → dst`.
  - For each terrain polygon the segment intersects, check `polygon.effect[r]`.
  - If any is `blocked`, store `'blocked'`.
  - Else if any has `speedMul < 1.0`, store `'penalised'`.
  - Else store `'free'`.

Cost: `O(F² · R · T)` where F = factory count, R = 3 ranks, T = terrain polygons. For F=20, R=3, T=15 that's 18,000 segment/polygon checks — trivially under one frame at map-load.

**Live recompute trigger:** only on terrain change (currently terrain is static per match; if v1.3 ever introduces destructible / dynamic terrain, this matrix invalidates and needs an incremental update path — flag for that future). Factories themselves do not move, so factory positions don't trigger recompute. **Factory ownership changes don't trigger recompute** — reachability is geometry × rank, not ownership.

`pathReachability(state, srcId, dstId)` is a one-line lookup: `state.reach[state.factories[srcId].rank][srcId][dstId]`.

### Why precompute over live-on-dragstart

Live-on-dragstart would be one source row of the matrix per dragstart — also fine, ~60 segment/polygon checks for the same F/T. But the matrix is needed anyway for the AI's pathing decisions (combat-balance agent's planning code reads it too), so doing it once at map-load is the natural home. The render path then never does geometry; it only does table lookups.

This also lets the spec's Section 4 ring layer scale linearly with on-screen factories without any per-frame intersection math.

---

## Section 5 — Pickup and snap radii

**Decision: keep `factoryPickupRadius: 58`, INCREASE `targetSnapRadius` from 64 → 72.**

### Argument

- **`factoryPickupRadius` (drag-start hit zone): keep at 58.** This is a "press on the factory you own" gesture; it competes with no other thing because the player is at rest before pressing. The current 58 (vs `factoryRadius: 36`) gives a 22px halo around the visible body — already generous on touch. Increasing it would risk grabbing factories the player meant to *not* grab when they were trying to tap UI just outside.

- **`targetSnapRadius` (drag-end snap zone): increase to 72.** Three reasons:
  1. **Terrain visual clutter.** Colored terrain polygons add high-frequency visual noise around factories. The player's pointer accuracy will degrade because their eye is parsing terrain colour, not factory position. A wider snap zone compensates.
  2. **The reachability-tint rings (Section 4) effectively grow the *visible* factory footprint** to `factoryRadius + 3 = 39`. The snap radius should track that, so 72 ≈ visible-footprint × 1.85 (vs current 64 ≈ visible-body × 1.78). Same proportion, accounting for the new ring.
  3. **The penalty for over-snap is now low.** With the pre-drag reachability tint, the player knows which factories are blocked before they release; an over-eager snap doesn't trick them into a wasted commit. The conservatism that justified 64 in v1.2 is gone.

### Numbers

```js
// src/data/factories.js
factoryPickupRadius: 58,   // unchanged
targetSnapRadius: 72,      // was 64
```

Implementer should treat 72 as a starting point and tune by playtest. If snap conflicts emerge between adjacent factories (i.e., the player drags between two close factories and the wrong one wins), revisit — but the existing nearest-within-radius tiebreak in `pickFactory()` handles that correctly.

---

## Section 6 — Touch vs mouse fidelity

### Pointer Events + setPointerCapture: confirmed correct abstraction

This is the right primitive. Keep it. The current `attachInput` is well-formed: unified mouse/touch/pen path, captured drags survive off-canvas wander, `pointercancel` cleanup is present. Do not rebuild on raw `touchstart`/`mousedown`.

### Touch-specific things to flag

1. **iOS Safari double-tap zoom.** A fast double-tap on the canvas can trigger Safari's double-tap-to-zoom even when each individual tap is a legitimate drag-start. Mitigation:
   - The `<canvas>` element (or its container) needs `touch-action: none` in CSS. This is an `index.html` / stylesheet change, not an input.js change — flag for the implementer to verify and add if missing.
   - Without `touch-action: none`, Safari may also delay the first `pointerdown` by ~300ms waiting to see if a second tap is coming. That delay will feel like input lag to the player and there is no JS-side workaround.

2. **iOS Safari pinch-zoom on two-finger touch.** If the player accidentally rests a second finger while dragging, the page may zoom. `touch-action: none` on the canvas covers this too.

3. **Android Chrome touch coalescing.** Chrome batches high-frequency touchmove events. The current `move()` handler uses the single event's `clientX/Y` only. For smoother drag lines on Android, consider:
   ```js
   function move(e) {
     // ... existing guards ...
     const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
     const last = events[events.length - 1];
     const { x, y } = viewportToMap(canvas, mapWidth, mapHeight, last.clientX, last.clientY);
     // (only the last coalesced point matters for snap — drag is a state, not a stroke history)
     // ...
   }
   ```
   Reading only the last coalesced event is correct here because the drag is a *position* not a *path* — we don't need every intermediate sample. This is a small drop-in improvement; not blocking.

4. **`pointerleave` is intentionally NOT bound.** With `setPointerCapture` active, leaving the canvas does not end the drag, which is what we want. Do not "fix" this by adding a leave handler; it would break captured drags.

5. **Pen pressure / tilt: ignore.** Drag-to-invade has no use for it. The default Pointer Events path handles pen just fine as a mouse equivalent.

---

## Section 7 — Haptic & sound stub call sites

The current `input.js` has no haptics/audio. Add stubs in the form `// audio.play('...')` and `// haptics.X('...')` so the future audio agent can grep for them and wire up the system without re-reading this spec.

### Stub placements (in `input.js`)

**1. In `move()`, immediately after `d.snappedTargetId` and `d.reachability` are updated**, detect transitions:

```js
// After computing newSnappedId / newReachability:
const prevSnap = d.snappedTargetId;
const prevReach = d.reachability;
d.snappedTargetId = newSnappedId;
d.reachability = newReachability;

if (newSnappedId !== prevSnap || newReachability !== prevReach) {
  if (newSnappedId && newSnappedId !== prevSnap) {
    // Snap engaged — variant by reachability.
    if (newReachability === 'free') {
      // audio.play('snap-on-free');     // crisp tick
      // haptics.tick('light');           // single 10ms pulse on supporting devices
    } else if (newReachability === 'penalised') {
      // audio.play('snap-on-penalised'); // muffled tick — signals "valid but slow"
      // haptics.tick('light');
    } else if (newReachability === 'blocked') {
      // audio.play('snap-on-blocked');   // dull thunk — signals "you can't do this"
      // haptics.error('double');         // two short pulses
    }
  } else if (!newSnappedId && prevSnap) {
    // Snap broken — releasing the lock back to free pointer.
    // audio.play('snap-off');            // soft de-tick, lower volume than snap-on
    // haptics.tick('verylight');         // optional; many designs omit haptic-off
  }
}
```

**Rationale for placement:** transitions are the *event*. Steady states must not re-fire audio per frame. Putting the detection in `move()` keeps it adjacent to the state mutation that causes it — no separate "transition detection" pass elsewhere.

**2. In `up()`, on a successful commit (snapped to non-source, not blocked)**, immediately before `toggleInvasion(...)`:

```js
if (snappedId && d.reachability !== 'blocked') {
  // audio.play('invasion-commit');      // affirming chord / confirm tone
  // haptics.tick('medium');              // 20ms — physical "yes"
  toggleInvasion(state, srcId, snappedId);
  return;
}
```

**3. In `up()`, on a blocked-target release (Section 2's denied flash)**, in the new branch the spec introduces:

```js
if (snappedId && d.reachability === 'blocked') {
  // audio.play('commit-denied');        // sharp negative tone, distinct from snap-on-blocked
  // haptics.error('strong');             // longest error pattern available
  viewState.deniedFlash = { factoryId: snappedId, until: performance.now() + 350 };
  return;
}
```

**Why two different "blocked" sounds (snap-on-blocked vs commit-denied):** the first teaches "you're aiming at something you can't reach"; the second teaches "you released anyway and the system refused." If they were the same sound, releasing on blocked would feel acoustically identical to merely hovering on blocked, hiding the cause/effect.

**4. In `up()`, on release-on-source (explicit clear)**:

```js
if (hit.f && hit.f.id === srcId) {
  // audio.play('clear-invasions');      // sweep-down tone, signals "wiping targets"
  // haptics.tick('medium');
  clearInvasions(state, srcId);
}
```

### What NOT to stub

- No haptic on `pointerdown` — touch already provides physical feedback (your finger touched the screen). Adding a vibration here is double-confirmation.
- No haptic on every `pointermove` frame. Continuous haptics are battery-heavy and feel cheap.
- No audio on drag-start. The visual reachability tints (Section 4) appearing is its own implicit feedback.

---

## Section 8 — Accessibility defaults

Color-only encoding fails for ~8% of male players (deuteranopia + protanopia combined). Cyan-vs-amber-vs-red is *especially* dangerous: amber and red collapse heavily under red-green colorblind simulation, and cyan reads as a desaturated grey. So every state distinction MUST also be encoded non-chromatically.

### Non-color encodings (already specced above; consolidating here)

| State | Color | Shape | Motion | Iconography |
|---|---|---|---|---|
| Empty (null) | white | dashed line | none | none |
| Free | cyan | solid line + solid ring | 1.2 Hz breathing pulse | none |
| Penalised | amber | solid line + dashed ring | 1.2 Hz breathing pulse | ⏳ / slow glyph above ring |
| Blocked | red | dashed line + ring + ⊘ overlay | single flash on entry, no breathing | ⊘ symbol IS the iconography |

Every row differs from every other row on at least 2 non-color axes. A protanopic or deuteranopic player can still tell all four states apart by line dash pattern, ring dash pattern, motion signature, and presence/absence of glyphs — color is redundant, not load-bearing.

### Pre-drag tint accessibility (Section 4 rings)

The pre-drag tints are subtler and can't carry as much non-color signal. Hence:
- Penalised ring is dashed (`[5, 4]`).
- Blocked ring carries a small ⊘ glyph in the top-right of the factory.
- Free ring is solid and clean.

A colorblind player can still scan the map pre-commit and identify blocked factories by the glyph alone.

### Hint text / screen-reader-equivalent overlay

Screen reader support on `<canvas>` is fundamentally weak — canvas is opaque to AT. The practical compensation is an **on-screen drag status text overlay** (lives in the canvas-overlay HUD, not `input.js` itself, but driven from `viewState.drag`):

- While dragging, render a small status line near the top of the canvas (or bottom-of-source-factory if space):
  - "Targeting: F-7 — clear path"
  - "Targeting: F-7 — slow (swamp)"
  - "Targeting: F-7 — BLOCKED (mountain, heavy rank cannot cross)"
  - (no snap) "Drag to a factory to set target"

This is a `frontend-ux-agent` deliverable; flag it as a dependent task. The `viewState.drag.reachability` field this spec introduces is the data source.

### Reduced-motion respect

Honour `window.matchMedia('(prefers-reduced-motion: reduce)')`:
- Snap ring breathing pulse: disabled (use steady alpha).
- Blocked flash: still fires once (it's informative, not decorative) but at half the alpha delta.
- Source-factory drag-pulse: disabled.

This check belongs in the renderer (which already owns animation timing), but the *decision* to honour it is part of this spec.

---

## Section 9 — Concrete deltas to `src/controller/input.js`

### New shape of `viewState.drag`

```js
viewState.drag = {
  active: true,
  srcId: f.id,
  x, y,
  snappedTargetId: null,
  reachability: null,        // NEW: 'free' | 'penalised' | 'blocked' | null
  pointerId: e.pointerId,
};
```

When `snappedTargetId === null`, `reachability` is also `null`. The two move together — they're never out of sync.

### New helper (lives where the reachability matrix lives — probably `src/model/terrain.js` or `src/model/reachability.js`)

```js
// pathReachability(state, srcId, dstId) → 'free' | 'penalised' | 'blocked'
// One-line lookup against the precomputed reach[rank][srcId][dstId] matrix.
// See Section 4 for matrix construction.
```

Imported by `input.js` and used inside `move()`.

### Updated `move()` skeleton

```js
function move(e) {
  const d = viewState.drag;
  if (!d || !d.active || d.pointerId !== e.pointerId) return;
  e.preventDefault();
  const { x, y } = viewportToMap(canvas, mapWidth, mapHeight, e.clientX, e.clientY);
  d.x = x; d.y = y;

  const snap = pickFactory(e.clientX, e.clientY, state.config.targetSnapRadius);
  const newSnappedId = (snap.f && snap.f.id !== d.srcId) ? snap.f.id : null;
  const newReachability = newSnappedId ? pathReachability(state, d.srcId, newSnappedId) : null;

  const prevSnap = d.snappedTargetId;
  const prevReach = d.reachability;
  d.snappedTargetId = newSnappedId;
  d.reachability = newReachability;

  // Transition-detection block (Section 7 stubs land here).
  if (newSnappedId !== prevSnap || newReachability !== prevReach) {
    // ... haptic/audio stubs as specced in Section 7 ...
  }
}
```

### Updated `up()` semantics (toggle-on-commit changes)

Current behaviour: any non-null `snappedTargetId` → `toggleInvasion`. New behaviour:

```js
function up(e) {
  const d = viewState.drag;
  if (!d || !d.active || d.pointerId !== e.pointerId) return;
  const srcId = d.srcId;
  const snappedId = d.snappedTargetId;
  const reach = d.reachability;
  d.active = false;
  d.snappedTargetId = null;
  d.reachability = null;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}

  if (snappedId && reach === 'blocked') {
    // Snap+blocked: deny, flash, no model mutation.
    // audio.play('commit-denied');
    // haptics.error('strong');
    viewState.deniedFlash = { factoryId: snappedId, until: performance.now() + 350 };
    return;
  }
  if (snappedId) {
    // 'free' or 'penalised' both commit.
    // audio.play('invasion-commit');
    // haptics.tick('medium');
    toggleInvasion(state, srcId, snappedId);
    return;
  }
  const hit = pickFactory(e.clientX, e.clientY, state.config.factoryPickupRadius);
  if (hit.f && hit.f.id === srcId) {
    // audio.play('clear-invasions');
    // haptics.tick('medium');
    clearInvasions(state, srcId);
  }
}
```

### Updated `cancel()`

```js
function cancel(e) {
  const d = viewState.drag;
  if (!d || !d.active || d.pointerId !== e.pointerId) return;
  d.active = false;
  d.snappedTargetId = null;
  d.reachability = null;     // NEW: clear with the rest
}
```

### New view-state field

`viewState.deniedFlash = { factoryId, until } | null` — written by `input.js`, read by `render.js`. The render contract is: while `now < until`, paint a red ring flash over the named factory; otherwise treat as absent and clear.

### Optional: source-factory pulse during drag

`render.js` can detect `viewState.drag.active` and draw the cyan breathing pulse on `getFactory(state, viewState.drag.srcId)`. No `input.js` change needed; the data is already in `viewState.drag`. Flag this for the renderer agent.

### Files touched by this spec (summary)

| File | Owner | Change |
|---|---|---|
| `src/controller/input.js` | input-handler-agent | All changes above |
| `src/data/factories.js` | combat-balance-agent (touched here for radii only) | `targetSnapRadius: 64 → 72` |
| `src/view/render.js` | renderer agent | New visual states B/C/D, pre-drag tints, denied flash, source pulse, reduced-motion gate |
| `src/model/reachability.js` (NEW) or extension of `src/model/terrain.js` | combat-balance/model agent | Matrix construction + `pathReachability()` helper |
| `index.html` / CSS | frontend-ux-agent | Add `touch-action: none` on canvas |
| Drag status text overlay | frontend-ux-agent | Accessibility text, see Section 8 |

---

## Section 10 — Confirmation / opinion

**The single most important change is Section 4: pre-drag reachability tinting.**

Every other change in this spec — the amber penalised state, the blocked ⊘ overlay, the denied-commit flash, the wider snap radius — is corrective. They all exist to *soften the cost of the player making a mistake* about terrain. The pre-drag tint is the only change that *prevents the mistake from being made*. It is the difference between "drag is a probe" (current model — you find out the rule by failing it) and "drag is an execution" (you already knew the rule from the press; the drag commits a planned move).

Action-game drag UX lives or dies on this distinction. Probe-style drag feels like the game is hiding information from you; execution-style drag feels like you're a competent commander reading the board. v1.3's whole reason for adding terrain ranks is to make the board readable — and Section 4 is what makes terrain-rank legibility happen *at the moment the player is about to act on it*, not retrospectively.

If the implementer can ship only one section from this spec, ship Section 4. Everything else is polish on top of that core affordance.

---

## Implementation checklist (for the implementer to tick through)

- [ ] Add `pathReachability(state, srcId, dstId)` helper and the per-rank reachability matrix (model layer).
- [ ] Add `reachability` field to `viewState.drag`; update `down()`, `move()`, `up()`, `cancel()`.
- [ ] Update `up()` to branch on `reachability === 'blocked'` → no-op + denied flash.
- [ ] Add `viewState.deniedFlash` schema; renderer paints + auto-expires it.
- [ ] Update `src/data/factories.js`: `targetSnapRadius: 64 → 72`.
- [ ] Add four drag-state visuals in `render.js` (free / penalised / blocked / empty) per Section 1.
- [ ] Add pre-drag reachability rings in `render.js` per Section 4.
- [ ] Add ⊘ overlay drawing (blocked ring + pre-drag blocked tint).
- [ ] Honour `prefers-reduced-motion` in render animation.
- [ ] Add `touch-action: none` to canvas CSS.
- [ ] Land all haptic/audio stub comments per Section 7. Do NOT implement the audio system itself.
- [ ] Flag to `frontend-ux-agent`: drag-status text overlay for accessibility (Section 8).
- [ ] Flag to renderer agent: invasion arrows should pick up reachability colouring (penalised arrows = amber) — out of scope here, but the data is now available.
- [ ] Playtest snap radius 72; tune to 68 or 76 if drag conflicts emerge between close factories.
