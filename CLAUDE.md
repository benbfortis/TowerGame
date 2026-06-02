# TowerGame — Project Rules (BINDING)

This file is loaded into every Claude session that runs in this repo.
It defines the structural mandates that all agents — including the parent
orchestrator and every dispatched subagent — must obey. These rules
**override** generic agent preferences and personal style.

## 0. Version display (UNIVERSAL HARD RULE)

The project version (`src/data/version.js` → `VERSION` constant) **must
appear in the bottom-right of every screen of the running app** — loadout
screen, gameplay, game-over modal. The badge is a fixed-position DOM element
(see `index.html` → `#hud-version`) populated at boot by `main.js`. Do not
remove it. Do not hide it. New screens must inherit it.

**Bump `VERSION` on every meaningful change** so a single screenshot can
confirm the user is looking at the new build (per the verification-discipline
rule in `~/.claude/CLAUDE.md`).

**Every agent finishing a piece of work in this repo must also display the
current version at the bottom of its user-facing reply** (format: `v1.3` or
similar). This applies to the parent orchestrator AND every dispatched
subagent. If you didn't read `src/data/version.js`, read it before answering.

## Read order (every agent, every session)

1. `CLAUDE.md` (this file) — non-negotiable rules
2. `.claude/instructions/GLOBAL.md` — universal agent protocol for this repo
3. `ARCHITECTURE.md` — MVC + module boundary contract
4. `ASSET_GUIDELINES.md` — asset categorisation & replacement contract

If any of those four files is missing, the agent must stop and report it
rather than proceed.

---

## 1. What TowerGame is

- **Platform:** web app (browser, ES modules, no build step required for dev).
- **Aspect:** **portrait** — same orientation as FrogGame. All UI, HUD,
  combat staging, and asset framing assume portrait. Landscape layouts
  are not supported and must not be added.
- **Renderer:** Canvas 2D (matches FrogGame). Any proposal to switch
  renderers (WebGL, Three.js, Phaser, Pixi) requires explicit user
  approval — agents do not make this call unilaterally.
- **Architecture:** **strict MVC** — see §3 and `ARCHITECTURE.md`.

## 2. Structural mandates (non-negotiable)

These are hard constraints. A PR or patch that violates any of them is
defective and must be rejected, not "improved later."

1. **MVC separation is enforced at the import graph.** `model/` files
   must not import from `view/`, `controller/`, or `ui/`. `view/` files
   must not import from `controller/`. The controller layer is the only
   mediator. See `ARCHITECTURE.md` for the exhaustive table.
2. **Strict modularity.** Every gameplay subsystem lives behind a
   single-file (or single-folder) module with a documented public
   surface. No "util grab-bag" files. No reaching into another
   module's private functions. No cyclic imports.
3. **Asset structure is the public swap interface.** Every actor,
   enemy, hero, boss, miniboss, ability, boon, tile, vfx, and ui
   element has its own folder under `assets/`. Assets are loaded
   through a manifest (see `ASSET_GUIDELINES.md`); code never inlines
   an asset path. Replacing the art for an actor must require zero
   code changes.
4. **Data-driven tuning.** Numeric values that designers care about
   (HP, damage, speed, cooldowns, drop rates, costs) live in
   `src/data/` as plain JSON or JS data tables — not as magic numbers
   in `model/` logic. Combat-balance work edits data, not code.
5. **No introduction of new top-level folders** without an ADR-style
   note in `ARCHITECTURE.md` describing why and who owns it.
6. **Portrait-first.** Any layout or coordinate math that assumes
   landscape is wrong.

## 3. MVC layer map (summary — full table in ARCHITECTURE.md)

```
src/
  model/        pure simulation state + rules. No DOM, no canvas, no input.
  view/         renders state to canvas + DOM. Pure read of model. No writes.
  controller/   input → intent → model mutation. Only layer allowed to mutate model.
  ui/           menus, settings, hero panels, devpanel. DOM-side UI, not in-game HUD.
  data/         static tuning tables. JSON or `export const TABLE = {...}`.
assets/         art + audio. Folder-per-actor. Manifest-driven.
scripts/        dev workflow scripts (asset gen, build, launch). Not shipped.
tools/          one-off authoring tools. Not shipped.
```

## 4. MANDATORY subagent routing (review & balance work)

When the user — or another agent — asks for any of the work categories
below, the responding agent **MUST** dispatch to the listed subagent.
Doing the work inline is a violation, even if the agent believes it
could answer faster.

| Work category                                       | Mandatory subagent             |
|-----------------------------------------------------|--------------------------------|
| Architecture review / module-boundary audit         | `webgame-architect-agent`      |
| Cross-repo boundary / folder hygiene                | `architecture-boundary-agent`  |
| Modularity audit / "is this too coupled?"           | `webgame-architect-agent`      |
| Game feel (hit-stop, screen shake, i-frames, etc.)  | `game-feel-tuner`              |
| Input feel (drag responsiveness, snap, touch targets, deadzones, haptics, drag-state visual feedback) | `input-handler-agent` |
| Combat balance (HP / damage / TTK / DPS / curves)   | `combat-balance-agent`         |
| Economy balance (currencies, sinks, pricing)        | `economy-balancer`             |
| Code correctness / security / general review        | `code-reviewer`                |
| QA / test plan / repro / coverage                   | `qa-test-agent`                |
| Playable smoke test of a built scenario             | `playable-smoke-runner`        |
| Full player-journey blocker analysis                | `flow-health-auditor`          |
| Save/load/persistence cycle verification            | `save-state-validator`         |
| New tactical scenario / level design / puzzle map   | `towergame-scenario-author`    |

Rules around the table:

- The agent dispatching the subagent must brief it with: the
  files/areas in scope, the specific question, and the relevant
  TowerGame rules from this file. A bare "please review" is
  insufficient.
- If the dispatcher believes the mandated subagent is the wrong tool,
  it must **say so to the user and ask** — never silently substitute.
- If multiple categories apply (e.g. a change touches combat balance
  *and* game feel), dispatch all relevant subagents in parallel.
- Implementation cluster: this is a `web-game` project — only
  `webgame-*` implementer agents apply. The `unity-*` cluster is
  forbidden and must not be invoked.

## 5. Refusal protocol

An agent operating in this repo must refuse and surface to the user
when asked to:

- bypass the routing table in §4,
- introduce a new top-level folder without an ADR,
- inline asset paths in code,
- have `model/` import from `view/` / `controller/` / `ui/`,
- switch renderer or aspect away from Canvas-2D portrait,
- copy code from FrogGame (this project is a structural fresh start;
  patterns may be referenced, code must be authored locally).

Refusal is not insubordination — it is the rule. Operator can override
any individual rule with an explicit instruction; the override should
be noted in the response.

## 6. What this file does *not* cover

- Genre, theme, mechanics, monetisation, story — open. Decide with the
  operator before scaffolding any system.
- Specific number ranges for HP/damage/etc — owned by `combat-balance-agent`
  and `economy-balancer`, stored in `src/data/`.
- Visual style — owned by `style-establisher` once the operator locks one;
  until then no batch art generation.
