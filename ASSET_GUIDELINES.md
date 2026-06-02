# TowerGame — Asset Guidelines (BINDING)

The asset tree is the **public swap interface** for art. Designers and
asset-generation agents must be able to replace any actor's visuals
without touching code. This document defines the layout, the manifest
contract, and the rules every asset-producing and asset-consuming agent
must follow.

> See `CLAUDE.md` §2.3 for the mandate; this file is the contract.

---

## 1. Folder layout

```
assets/
  heroes/<heroId>/            one folder per playable hero
  enemies/<enemyId>/          one folder per enemy archetype
  bosses/<bossId>/            one folder per boss
  minibosses/<id>/            one folder per miniboss
  player/                     the controlled actor's frames + sheets
  abilities/<abilityId>/      ability icons + effect art
  boons/<boonId>/             boon icons + effect art (if any)
  traits/<traitId>/           trait icons
  tiles/<tileId>/             ground/wall/decor tiles
  vfx/<vfxId>/                visual-effect sheets
  ui/<componentId>/           UI sprites, 9-slice panels, buttons
```

Rules:

- One folder per "thing." If an enemy has 6 frames and a death sheet,
  it lives in `assets/enemies/<id>/` — not scattered across the tree.
- Folder ids are **kebab-case** and stable. Renaming a folder is a
  contract change and requires a manifest update + a code reference
  audit.
- A `nanobanana-output/` subfolder under any actor folder is reserved
  for raw generator output. The shipped asset is at the actor-folder
  root. Code never points into `nanobanana-output/`.
- New top-level asset categories require a one-line addition to this
  file and to the manifest schema (§3).

## 2. File naming inside an actor folder

```
assets/enemies/charger/
  charger.png            primary still / portrait
  charger_idle.png       (or sheet)
  charger_walk.png
  charger_attack.png
  charger_hit.png
  charger_death.png
  manifest.json          per-actor manifest (see §3)
  nanobanana-output/     raw generator output (not shipped)
```

- All frame / sheet file names are prefixed with the folder id —
  this makes grep, finder search, and accidental-rename detection
  trivial.
- Sprite-sheets end in `_sheet.png` and ship alongside a `_sheet.json`
  with frame UVs.
- Audio (when introduced) sits in the same folder under `sfx/`
  with the same id-prefix rule.

## 3. Manifest-driven loading

Code **never** hard-codes an asset path. Every actor folder ships a
`manifest.json` that declares its assets; the loader resolves these
at boot.

`assets/enemies/charger/manifest.json`:
```json
{
  "id": "charger",
  "kind": "enemy",
  "sprites": {
    "idle":   "charger_idle.png",
    "walk":   "charger_walk.png",
    "attack": "charger_attack.png",
    "hit":    "charger_hit.png",
    "death":  "charger_death.png"
  },
  "sheets": {},
  "sfx": {}
}
```

And a top-level `assets/manifest.json` indexes them:
```json
{
  "enemies": ["charger", "bomber", "bug", "..."],
  "heroes":  ["knight", "mage", "..."],
  "bosses":  ["toad", "hornet", "..."]
}
```

Consumer code:
```js
// view/sprites.js — correct
import { loadActor } from './loader.js';
const charger = await loadActor('enemies', 'charger');
ctx.drawImage(charger.sprites.idle, x, y);
```

```js
// view/anywhere.js — FORBIDDEN
const img = new Image();
img.src = 'assets/enemies/charger/charger_idle.png'; // ❌ inline path
```

## 4. Drop-in replacement contract

Replacing the art for any actor must require **zero code changes**.
That means:

- The new files use the same filenames as the old (or the manifest is
  updated; the loader respects it either way).
- The folder id does not change.
- New sprites preserve the same logical anchor (feet-centred for
  ground actors, body-centred for flying, top-left for tiles).
- New sheets preserve the same frame count and order, or update
  `_sheet.json` to match.

If a swap requires a code change, the swap was incorrect.

## 5. Aspect & framing (portrait-first)

- Portraits, hero stills, boss reveals: portrait orientation
  (typically 3:4 or 9:16). Never landscape.
- In-game actor sprites: tight, transparent-background, feet at the
  bottom edge for ground units.
- UI sprites: design for the portrait HUD; no assumptions about
  landscape layouts.

## 6. Agent ownership

| Asset task                                       | Owner agent                       |
|--------------------------------------------------|-----------------------------------|
| Establish project palette / style anchor         | `style-establisher` (one-time)    |
| Per-actor sprite generation (≤128px)             | `game-sprite-author`              |
| Hero / boss portraits (≥512px)                   | `character-portrait-designer`     |
| Ability / UI / inventory icons                   | `icon-creator`                    |
| UI mockups (HUD, menus, shops)                   | `mockup-creator`                  |
| Environment / level concept art                  | `environment-concept-artist`      |
| Tileable terrain / surface textures              | `tileable-texture-generator`      |
| VFX sheets (smoke / fire / magic / sparks)       | `particle-vfx-sheetwriter`        |
| Logo / wordmark / app icon                       | `logo-and-wordmark-designer`      |
| Background removal / cleanup                     | `transparent-bg-extractor`        |
| Spritesheet packing                              | `spritesheet-packer`              |
| Naming-convention enforcement                    | `asset-naming-enforcer`           |
| Web-game asset import + manifest wiring          | `webgame-asset-importer`          |
| Style-drift review on batches                    | `art-style-auditor`               |

Generation rules:
- Image generation routes through **nano-banana via the Fortis
  gateway** (`scripts/gen-image-fortis.sh`). Do not invoke Flux2.
  Do not expect a personal `GEMINI_API_KEY`.
- New asset batches must be reviewed by `art-style-auditor` before
  being marked shipped.

## 7. Anti-patterns (auto-reject)

- Asset path string-literals in `src/` outside the loader.
- A `misc/` or `temp/` folder under `assets/`.
- Mixed-id files inside one folder (e.g. `goblin_idle.png` sitting in
  `assets/heroes/knight/`).
- A `assets/<id>.png` floating at a category root, not inside its own
  folder.
- New asset types added without a manifest schema bump.
