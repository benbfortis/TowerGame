# TowerGame — Per-Agent Global Instructions

Every agent operating in this repo must:

1. Read `CLAUDE.md` at the repo root before acting.
2. Read `ARCHITECTURE.md` if the task touches `src/`.
3. Read `ASSET_GUIDELINES.md` if the task touches `assets/` or generates art.
4. Honour the mandatory routing table in `CLAUDE.md` §4.
5. **Display the project version** (read from `src/data/version.js`) at the
   bottom of your user-facing reply. Format: `v<VERSION>` (e.g. `v1.3`). This
   is binding per `CLAUDE.md` §0 — apply it on every turn that produces output.

If those files cannot be located, stop and report — do not infer rules.

---

## The routing rule (restated for visibility)

The parent orchestrator is **bound** to dispatch the listed subagent for
each work category. The dispatched subagent is also bound: if it
receives a request that should have been routed to a sibling specialist
(e.g. `code-reviewer` receives a combat-balance question), it must say
so and decline, surfacing the correct routing back to the parent.

| Work category                                       | Mandatory subagent             |
|-----------------------------------------------------|--------------------------------|
| Architecture / module-boundary / modularity audit   | `webgame-architect-agent`      |
| Cross-folder hygiene / dead-code removal            | `architecture-boundary-agent`  |
| Game feel (hit-stop, shake, i-frames, telegraphs)   | `game-feel-tuner`              |
| Input feel (drag, snap, touch targets, haptics, drag visual feedback) | `input-handler-agent` |
| Combat balance (HP, damage, TTK, DPS, curves)       | `combat-balance-agent`         |
| Economy balance (currencies, sinks, pricing)        | `economy-balancer`             |
| Code correctness / security / general review        | `code-reviewer`                |
| Tests / repro / coverage                            | `qa-test-agent`                |
| Built-game scenario smoke test                      | `playable-smoke-runner`        |
| Player-journey blocker analysis                     | `flow-health-auditor`          |
| Save / load / persistence cycles                    | `save-state-validator`         |
| New tactical scenario / puzzle map / level design   | `towergame-scenario-author`    |

## The implementation-cluster rule

`project_type` for TowerGame is `web-game` (see
`.atlascontext/project.json`). The only valid implementer cluster is
`webgame-*`:

- `webgame-architect-agent` (boundaries, modularity)
- `webgame-script-stubber` (TS/JS skeletons)
- `webgame-entity-builder` / `webgame-entity-modifier`
- `webgame-scene-composer`
- `webgame-material-applier`
- `webgame-asset-importer`
- `webgame-ui-builder`
- `webgame-shader-author`
- `webgame-runtime-agent` (filesystem / dev server plumbing)

`unity-*` agents must not be dispatched. A plan that names a `unity-*`
agent for TowerGame is a defect; the coordination architect should
refuse it and route back to the planner.

## The MVC rule (restated)

`model/ ✗ view/`. `model/ ✗ controller/`. `model/ ✗ ui/`.
`view/ ✗ controller/`. `view/ ✗ ui/`.
Only `controller/` mutates `model/`. Only `ui/` calls controller actions.
Full table in `ARCHITECTURE.md`.

## The asset rule (restated)

Asset paths never appear as string literals in `src/`. All loading goes
through the manifest. Replacing an actor's art is a zero-code-change
operation. Full contract in `ASSET_GUIDELINES.md`.

## What "trivial" means in this repo

Per `~/.claude/CLAUDE.md`, trivial work can skip the orchestration
pipeline. In TowerGame, "trivial" is:

- a one-line edit in a single file with obvious scope,
- a factual lookup,
- a docs typo,
- a folder/file rename with no consumers (none yet exist).

Anything that adds gameplay code, changes balance, generates assets,
introduces a new module, or changes an existing module's public
surface is **not trivial** — run the routing rules.

## Refusal posture

If asked to violate any rule in this file or in `CLAUDE.md`, the agent
must refuse and surface the conflict. The operator can override any
single rule explicitly; the override should be acknowledged in-line and
noted in the response. Silent compliance with a rule-breaking request
is itself a defect.
