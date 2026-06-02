# TowerGame — Architecture Contract (BINDING)

This document defines the module boundaries, import rules, and
ownership of every layer in `src/`. It is enforced by
`webgame-architect-agent` during reviews. Violations block merge.

> See `CLAUDE.md` §3 for the layer summary and §4 for the mandatory
> review-agent routing.

---

## 1. Layer map

```
src/
  model/        Pure simulation. State + rules. No DOM. No canvas. No input.
  view/         Renders model → pixels/DOM. Reads model. Never mutates it.
  controller/   Translates input + time → mutations on model. Sole writer.
  ui/           Out-of-game UI (menus, settings, hero panel, devpanel).
                DOM-side. Reads model via controller-exposed selectors.
  data/         Static tuning tables (JSON / `export const`).
                Imported by model and ui. Never mutated at runtime.
  main.js       Boot: wires data → model → view → controller → ui. Nothing else.
  game.js       The top-level loop / frame tick. Calls controller.tick().
```

## 2. Import rules (the only table that matters)

A row may import from a column only where ✅. Anything else is a defect.

|              | model | view | controller | ui | data | main/game |
|--------------|:-----:|:----:|:----------:|:--:|:----:|:---------:|
| **model**    |  ✅   |  ❌  |     ❌     | ❌ |  ✅  |    ❌     |
| **view**     |  ✅   |  ✅  |     ❌     | ❌ |  ✅  |    ❌     |
| **controller**| ✅   |  ✅  |     ✅     | ❌ |  ✅  |    ❌     |
| **ui**       |  ✅¹  |  ❌  |     ✅²    | ✅ |  ✅  |    ❌     |
| **data**     |  ❌   |  ❌  |     ❌     | ❌ |  ✅  |    ❌     |
| **main/game**|  ✅   |  ✅  |     ✅     | ✅ |  ✅  |    ✅     |

¹ `ui` may *read* model state (read-only selectors / snapshots).
  It must not mutate model directly — go through controller.
² `ui` calls controller actions (`controller.startRun()`,
  `controller.equipHero(id)`, etc.). It never reaches into controller
  internals.

### Forbidden under all circumstances

- Cyclic imports between sibling modules in `model/`.
- `model/` importing anything that touches `window`, `document`,
  `requestAnimationFrame`, `HTMLCanvasElement`, `Audio`, or DOM events.
- `view/` writing to model fields. Use a controller action.
- A "shared util" file that imports from more than one layer.
- Reaching into another module by a relative path that crosses more than
  one folder boundary (e.g. `../../model/enemies-runtime.js` from inside
  `view/combat/`). Re-export through the layer's public surface.

## 3. Module shape (the per-file contract)

Every module in `src/model/`, `src/view/`, `src/controller/`, `src/ui/`:

1. Exports a small **public surface** at the top of the file.
2. Keeps internals as non-exported functions (private by convention).
3. Documents the public surface with a one-line comment per export
   describing what it does and what layer is expected to call it.
4. Does **not** mutate global singletons. State lives in `model/state.js`
   (or a similarly named single owner per subsystem).

Example skeleton:

```js
// model/towers.js
// Public surface:
//   buildTower(state, kind, gridX, gridY)   — controller calls
//   tickTowers(state, dt)                   — controller's frame step calls
//   listTowers(state)                       — view + ui read-only
//   serialiseTowers(state)                  — persistence layer

import { TOWER_TABLE } from '../data/towers.js';

export function buildTower(state, kind, x, y) { /* ... */ }
export function tickTowers(state, dt) { /* ... */ }
export function listTowers(state) { /* ... */ }
export function serialiseTowers(state) { /* ... */ }

// private helpers below — not exported
function _cost(kind) { return TOWER_TABLE[kind].cost; }
```

## 4. Data-driven tuning

- All gameplay numbers live in `src/data/` files.
- Files in `src/data/` export plain objects or arrays — no logic.
- `model/` reads from `data/` at boot or on demand; it does not embed
  numeric literals for gameplay (hit-points, cooldowns, ranges, prices,
  drop weights, etc.).
- `combat-balance-agent` and `economy-balancer` edit `src/data/` exclusively.
  They are not authorised to touch `model/` logic.

## 5. Subsystem ownership

When new gameplay systems land, give each one a single owner file in
`model/` and (if needed) a single companion file in `view/` and one in
`controller/`. Document the trio's names in this file under the section
below as the project grows.

| Subsystem | model file | view file | controller file | data file |
|-----------|-----------|-----------|-----------------|-----------|
| _(none yet — fill in as systems land)_ | | | | |

## 6. Boot order (`main.js`)

`main.js` is the only file allowed to wire layers together. The required
order is:

1. Load data tables.
2. Construct initial model state.
3. Construct view (bind canvas + DOM nodes).
4. Construct controller (give it model + view refs).
5. Construct ui (give it controller refs + read-only model selectors).
6. Start `game.js` loop.

Anything else in `main.js` is wrong; push it into the appropriate layer.

### 6.1 Frame tick order (BINDING)

`controller/tick.js` MUST execute subsystems in this order each frame:

1. **AI decisions** — `tickAi()` returns a list of `{ srcId, dstId }`; controller
   applies them via `setInvasion / clearInvasion` (the same actions the player
   uses). AI never mutates model state directly.
2. **Factories** — level-up timers + unit spawns toward each factory's
   current target.
3. **Units** — movement, opposite-direction collision, arrival
   (damage / heal / capture).
4. **Winner check** — `checkWinner()` runs LAST so end-of-game is detected
   in the same frame the capturing hit lands.

The order is load-bearing:

- AI-before-factories so freshly-chosen targets drive THIS frame's spawns.
- Factories-before-units so new spawns participate in this frame's movement.
- Units-before-winner-check so captures are detected the moment they happen.

Reordering, or interleaving a new subsystem at the wrong slot, requires an
ADR (see §7) explaining why the dependency has changed.

## 7. ADR policy

A new top-level folder, a new layer, a new cross-layer dependency, or a
change to this table requires:

1. A short paragraph in this file under a new `## ADR-NNN` heading,
   stating the change, the reason, and the date.
2. An explicit user approval acknowledged in the response that
   introduces the change.

## 8. Review pipeline

For any non-trivial code change in `src/`:

- `webgame-architect-agent` audits module boundaries.
- `code-reviewer` audits correctness/security.
- If the change is in `controller/` or `model/` combat code:
  `combat-balance-agent` confirms data assumptions still hold.
- If the change is in `view/` for moment-to-moment polish:
  `game-feel-tuner` is consulted.

The dispatcher is the parent orchestrator — see `CLAUDE.md` §4 for the
binding routing table.
