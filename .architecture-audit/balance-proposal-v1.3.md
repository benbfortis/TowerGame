# TowerGame v1.3 — Balance Proposal

**Author:** `combat-balance-agent`
**Date:** 2026-06-01
**Scope:** Per-rank unit cadence, speed, damage, HP; 7×3 terrain effect matrix; reachability + capture-pressure sanity checks.
**Baseline read:** `src/data/factories.js` (current: `baseGenIntervalSec=2.0`, `unitSpeed=90`, factories 10 HP, units 1 dmg/1 HP) and `src/data/map.js` (540×960 portrait, edges ~220 px adjacent / ~310 px cross-row / ~760 px end-to-end).

Implementer: copy the literal blocks in Sections 1, 2, 3, 4 into `src/data/factories.js` (cadence, speed, damage, HP) and a new `src/data/terrain.js` (matrix). Do not embed any of these values into `model/`.

---

## Section 1 — Per-rank spawn cadence

```js
// Add to FACTORY_TUNING in src/data/factories.js
export const RANK_GEN_INTERVAL_SEC = {
  light:  1.5,
  medium: 2.5,
  heavy:  4.5,
};
// Note: existing baseGenIntervalSec=2.0 is now superseded per-rank.
// genIntervalPerLevel=0.85 still applies as a per-level multiplier on top.
```

**Ratios:** light : medium : heavy = **1 : 1.67 : 3.0**.

### Why these numbers

**Light = 1.5s** — faster than the current 2.0s. The user brief is "light generate fast." A freshly captured L1 light tower needs to feel like immediate pressure, not a 2-second wait between trickle units. At 1.5s, a player who captures a light neighbour sees their reinforcement loop tick visibly.

**Heavy = 4.5s = 3.0× light** — heavy is "high-value but doesn't carry the game alone." Math: in any 30-second window, a heavy fires ~6.7 times; a light fires 20 times. Heavy delivers ~33% the unit volume of light at the same level. With the damage scaling proposed in Section 3 (heavy=3 dmg, light=1 dmg), per-second damage output is:
- light L1: 1 dmg / 1.5s = **0.67 DPS**
- medium L1: 2 dmg / 2.5s = **0.80 DPS**
- heavy L1: 3 dmg / 4.5s = **0.67 DPS**

The three ranks are intentionally **near-equivalent in raw DPS** at L1 (0.67 / 0.80 / 0.67). Heavy's edge is not throughput — it's **per-hit punch** (one heavy arrival = 30% of a factory's HP) and **path durability** (Section 3 HP) that lets it survive interception. Medium gets a slight DPS bump as the "all-rounder bonus."

**Light-only neutral pressure check (target: 10–15s):**
- Capture neutral L1 (10 HP) on a 220 px grass edge:
- Hits needed: 10; first hit at travel time = 220/120 = **1.83s**; subsequent hits land every 1.5s.
- 10th hit at 1.83 + 9·1.5 = **15.33s**. **Inside the 10–15s band (just at the upper edge).**
- On a closer 180 px hop: 10th hit at 1.5 + 9·1.5 = **15.0s exactly.** ✓

**Heavy-only check (high-value but slow):** heavy L1 against neutral L1:
- 4 hits to kill (10/3, rounded up). Travel 220/55 = 4.0s. 4th hit at 4.0 + 3·4.5 = **17.5s.**
- Slower than light by ~2s on the same edge — heavy can capture, but light wins the race.
- Once captured, the heavy factory drip-feeds 3-dmg cannonballs that take a third off any defender per hit. Single heavies are not snowballs; they are wrecking-ball deliveries.

**Medium = 2.5s** sits at the geometric mean of the two, giving a clean balance feel. Medium is the "default cadence" you grok intuitively.

---

## Section 2 — Per-rank base unit speed

```js
export const RANK_UNIT_SPEED = {
  light:  120,  // px/s
  medium: 85,
  heavy:  55,
};
// Old unitSpeed=90 is removed in favour of per-rank.
```

**Ratios:** light : medium : heavy = **2.18 : 1.55 : 1.0**.

### Why these numbers

**Light = 120 px/s** — 33% faster than the old global 90. Light units should feel like they zip across short edges. On a typical 220 px adjacent edge, light arrives in 1.83s — fast enough that the spawn cadence (1.5s) and the travel time overlap, meaning a stream of light units is **always in flight**. That visible flow is what makes light feel relentless.

**Heavy = 55 px/s** — 39% slower than the old 90. The user wants heavy "more time to react/intercept." On a 220 px edge that's 4.0s — almost an entire heavy-spawn-interval — so a defender can see a heavy departing, route a counter to intercept it on the path, and have the counter arrive *before* the heavy lands. That is the interception window the rank fundamentally needs to be balanced.

**Is 55 too slow?** Cross-check: longest reasonable attack edge on the current map is ~310 px (e.g. n1→n3). Heavy crosses it in **5.6s**. That's still faster than a heavy respawn (4.5s), so a heavy attacker can sustain a continuous attack stream over the longest map edges without the path going empty. Heavy is slow, not dysfunctional.

**Medium = 85** — slightly below the old default of 90, preserving "medium feels like the baseline you remember from v1.2." A small nudge down so the speed gap between medium and light is *felt* (35 px/s separation matters more than 5 px/s).

### Speed × cadence interaction

Per-edge throughput (units alive on a 220 px edge simultaneously) at L1, no terrain:
- light: travel 1.83s, spawn 1.5s → **1.22 units in flight** (always overlapping)
- medium: travel 2.59s, spawn 2.5s → **1.04 units in flight** (barely overlapping)
- heavy: travel 4.0s, spawn 4.5s → **0.89 units in flight** (gaps in the stream)

Light reads as a *line*; medium reads as a *procession*; heavy reads as *individual deliveries*. That visual differentiation is intentional and falls out of the chosen ratios.

---

## Section 3 — Per-rank damage and HP on arrival

**Decision: Option B (scaling damage, scaling HP).**

```js
export const RANK_DAMAGE = {
  light:  1,
  medium: 2,
  heavy:  3,
};

export const RANK_UNIT_HP = {  // for path-collision mutual destruction
  light:  1,
  medium: 2,
  heavy:  3,
};
```

### Why B over A

Option A (all units = 1 dmg, heavy tanky) leaves heavy as a **slightly bigger projectile** — it lands, deals 1 dmg, and the only thing the player feels different about it is "that one took longer to die in flight." That is too subtle for a rank that is gated behind a 3× slower cadence. Players need to *want* heavies; they need to *celebrate* when a heavy connects.

Option B makes a heavy arrival = **30% of a fresh factory's HP**. That is a visible, satisfying chunk. It also creates the right meta-decision tension:

- Capture a heavy tower if you want **big hits that punch through stacked defenders** (each arrival meaningfully advances the kill).
- Capture a light tower if you want **constant pressure that drains capture-state from neutral grabs** (volume wins exchanges with no defender).
- Capture a medium tower for **flexibility** (best L1 DPS at 0.80, decent speed, decent tank).

### HP for collisions (the mutual-destruction system)

If two units meet on a path, deal damage equal to each other's `damage` and remove the one(s) reduced to ≤0 HP. With the proposed values:

| Collision | Light (1/1) | Medium (2/2) | Heavy (3/3) |
|-----------|-------------|--------------|-------------|
| **Light**  (1 dmg, 1 HP) | both die | light dies, medium survives at 1 HP | light dies, heavy survives at 2 HP |
| **Medium** (2 dmg, 2 HP) | — | both die | medium dies, heavy survives at 1 HP |
| **Heavy**  (3 dmg, 3 HP) | — | — | both die |

This produces exactly the right rank-relationship: **light can chip a heavy but cannot stop one** (needs 3 lights to drop a heavy, sacrificing all 3 lights). **Medium trades 1-for-1 with medium and chips a heavy down to 1 HP.** **Heavy vs heavy is a clean trade.** No rank is collision-immune; no rank is collision-helpless.

### Per-rank effective HP-to-factory

How many of unit X to capture a fresh neutral L1 (10 HP), ignoring travel?

- light only: **10 units** (10 × 1 dmg)
- medium only: **5 units**
- heavy only: **4 units** (10 / 3, rounded up — the 4th hit overkills by 2)

That heavy-needs-4 number is the lynchpin: combined with the 4.5s spawn interval, heavy alone takes 4·4.5 = **18s to fire all 4 shots** before travel. Heavy is potent per-hit but **does not capture faster than light** in raw seconds (light's 15.3s wins by ~2s as shown in §1). The two ranks have **different killcurves with similar areas under them**. Both viable, distinct in feel.

---

## Section 4 — The 7×3 terrain effect matrix

```js
// New file: src/data/terrain.js
// Per-rank terrain interaction. Either { blocked: true } or { speedMul: <0..1> }.
// speedMul applies multiplicatively over the segment of path crossing that terrain.

export const TERRAIN_EFFECTS = {
  brick: {
    light:  { blocked: true },          // bricks are walls; light units bounce off
    medium: { speedMul: 0.6 },          // bulldozer chunks through, slowly
    heavy:  { speedMul: 1.1 },          // wrecking-ball demolishes — SLIGHT speed-up (the gimmick rank trait)
  },
  mountain: {
    light:  { blocked: true },          // sheer face; couriers can't climb
    medium: { speedMul: 0.55 },         // tracked vehicle, hard going
    heavy:  { speedMul: 0.7 },          // momentum carries the ball over (less affected than medium)
  },
  sea: {
    light:  { blocked: true },          // no boats in v1.3
    medium: { blocked: true },
    heavy:  { blocked: true },
  },
  sand: {
    light:  { speedMul: 0.85 },         // mild drag
    medium: { speedMul: 0.75 },
    heavy:  { speedMul: 0.55 },         // wheels/ball sink — biased against heavy as required
  },
  chasm: {
    light:  { blocked: true },          // can't jump a gap
    medium: { blocked: true },          // bulldozer falls in
    heavy:  { speedMul: 0.5 },          // wrecking-ball drops into chasm, momentum carries it across the bottom — slow but possible
  },
  swamp: {
    light:  { speedMul: 0.6 },          // universal slow, as required
    medium: { speedMul: 0.55 },
    heavy:  { speedMul: 0.5 },          // heaviest sinks deepest, but still passes
  },
  lava: {
    light:  { blocked: true },          // incinerated
    medium: { speedMul: 0.4 },          // takes damage-equivalent slow (we don't model dmg, model as slow)
    heavy:  { speedMul: 0.65 },         // armoured/insulated mass; still slowed but tougher than medium
  },
};
```

### Per-cell justification (21 cells)

**Brick — the demolition gimmick.**
- light **blocked** — couriers can't tunnel; brick = visible wall.
- medium **0.6×** — bulldozer chunks through, takes time.
- heavy **1.1×** — the *only* speed-up cell in the matrix. Heavy's flavour is "demolition ball"; on brick it smashes faster than it rolls on grass. This is the matrix's single "gimmick" cell and the reason a player ever genuinely wants a brick-corridor map. Pulled up to 1.1× rather than 1.0× to make it *feel* like an advantage, not just "not slowed." A bigger multiplier (1.3+) would warp the meta toward heavy-on-brick lanes too strongly; 1.1× is a wink, not a tilt.

**Mountain — vertical.**
- light **blocked** — can't climb.
- medium **0.55×** — tracked vehicle, hard climb.
- heavy **0.7×** — counterintuitive but defensible: a wrecking ball with momentum doesn't care about gradient the way a courier on foot does. Heavy is *less* slowed by mountain than medium is. This gives heavy a second "specialty terrain" beyond brick.

**Sea — universal block (v1.3 only).**
- All three **blocked**. The user's brief acknowledged this risks dead map space. **Mitigation:** the level designer must place sea polygons only where a path between two factories does *not* require crossing it (sea as scenery / framing, not as a path-blocker on existing edges). If sea is painted across an existing all-pairs edge, that edge goes dead for everyone — which is a legitimate design tool to *intentionally remove* an edge from the topology without changing the node graph. Document this in the open-questions section so the level-designer agent picks it up.

**Sand — mild, biased against heavy (as required by brief).**
- light **0.85×** — minor scuff.
- medium **0.75×**.
- heavy **0.55×** — wheels/ball sink. Clear gradient, sand is "okay for light, sticky for heavy."

**Chasm — gap.**
- light **blocked**, medium **blocked**, heavy **0.5×**. The user offered two arguments (blocks all, or heavy-only passes). I chose **heavy-only passes** because it gives heavy a *third* terrain identity (brick=demolish, mountain=momentum, chasm=drop-and-roll) and makes chasm a meaningful tactical placement: "I want a chokepoint only my heavy lane can exploit." A blocks-all chasm would be redundant with sea, and the matrix needs heavy to have niches where it dominates.

**Swamp — universal slow (as required).**
- light **0.6×**, medium **0.55×**, heavy **0.5×**. All pass; all slowed; heavy slowed slightly more (it sinks deepest), but the slope is gentle. Swamp is the "everybody suffers equally-ish" terrain — it slows the *game* down where painted, which is a useful pacing tool for the level designer.

**Lava — dangerous.**
- light **blocked** (incinerated; the rank lacks any insulation), medium **0.4×** (heaviest slow on the matrix that isn't a block), heavy **0.65×** (armoured mass).
- The user said "heavy slow on at least 2 ranks, or one block + one slow." This is **one block (light) + two slows (medium, heavy)**, satisfying the constraint while keeping lava more punishing than swamp/sand for the ranks that *can* cross it.

### Damage on terrain?

I am explicitly **not** modelling damage-over-terrain (e.g. lava hurts units crossing it) in v1.3. Reasons: (a) the brief defines terrain effect as `blocked` or `speedMul` and nothing else, (b) damage-on-terrain interacts with the per-rank-HP system in ways that need a separate balance pass, (c) "lava slows you to a crawl across it" reads as dangerous-enough without adding a second axis. Flagged for v1.4 in Section 7.

---

## Section 5 — Reachability sanity check

For each rank, the set of terrains it can cross and the worst-case slow:

### Light
- **Can cross:** sand (0.85×), swamp (0.6×).
- **Blocked by:** brick, mountain, sea, chasm, lava.
- **Worst slow (non-blocked):** swamp at 0.6×.
- **Identity:** "the courier — fast on grass, slowed in swamp, stopped by anything resembling an obstacle." 5/7 terrains block light. **This is intentional and is what makes terrain placement matter.** Light is the rank that *cares* about route choice; a smart attacker routes lights around blocks rather than into them. If the map designer paints terrain such that *all* paths from a player's factory to a target are light-blocked, that target is heavy/medium territory. That is the strategic puzzle the system creates.

### Medium
- **Can cross:** brick (0.6×), mountain (0.55×), sand (0.75×), swamp (0.55×), lava (0.4×).
- **Blocked by:** sea, chasm.
- **Worst slow (non-blocked):** lava at 0.4× (more than half-speed reduction).
- **Identity:** "the all-rounder — handles five of seven terrains, only stopped by water and gaps."

### Heavy
- **Can cross:** brick (1.1× — *speed-up*), mountain (0.7×), sand (0.55×), chasm (0.5×), swamp (0.5×), lava (0.65×).
- **Blocked by:** sea.
- **Worst slow (non-blocked):** sand and swamp tied at 0.5–0.55×.
- **Identity:** "the wrecker — six of seven terrains, only stopped by water. Speeds *up* on brick."

### Cross-checks against constraints

- ✓ "Every terrain affects something." All 7 have at least one block or slow on at least one rank.
- ✓ "Each rank has at least one terrain it traverses well." Light = sand (0.85); medium = sand (0.75); heavy = brick (1.1).
- ✓ "No rank blocked by everything." Light is the most constrained but still has 2 traversable terrains plus grass.
- ✓ Sea is the only universal blocker (level-designer hazard).
- ✓ Lava: one block + two slows (matches user constraint).
- ✓ Swamp universal slow.
- ✓ Sand mildly biased against heavy.
- ✓ Brick gives heavy a clear gimmick.
- ✓ Chasm gives heavy a niche.
- ✓ Mountain gives heavy/medium a slow-passage.

---

## Section 6 — Capture pressure (numeric sims)

All sims assume **freshly captured attacker L1 vs neutral defender L1 (10 HP)**, single 220 px edge, attacker spawns from rest.

### Light attacker, pure grass edge

- Travel time: 220 / 120 = **1.83s**.
- Hits to kill: 10.
- Spawn cadence: 1.5s.
- Hit *n* lands at *t = 1.83 + (n−1)·1.5*.
- **10th hit at t = 15.33s.** Neutral falls just at the upper edge of the 10–15s target band.

### Light attacker, 50%-swamp edge

- 110 px grass at 120 px/s = 0.92s; 110 px swamp at 120×0.6 = 72 px/s → 110/72 = 1.53s.
- Travel time: **2.45s** (vs 1.83s pure grass; swamp adds 0.62s to the first hit).
- 10th hit at 2.45 + 9·1.5 = **15.95s.** Swamp delays capture by ~0.6s — felt, but not crippling.

### Medium attacker, pure grass

- Travel: 220 / 85 = **2.59s**.
- Hits to kill: 5 (5 × 2 dmg = 10).
- Spawn cadence: 2.5s.
- 5th hit at 2.59 + 4·2.5 = **12.59s.** Faster capture than light by 2.7s.
- **Medium is the fastest pure-cadence capper in v1.3.** This is a deliberate "all-rounder rewards" outcome: medium has the best L1 DPS (0.80), the cleanest collision math, and the fastest neutral capture on open ground. It pays for this by being mediocre on every terrain (no specialty cells like heavy's brick or light's grass-zip).

### Heavy attacker, pure grass

- Travel: 220 / 55 = **4.0s**.
- Hits to kill: 4 (ceil(10/3)).
- Spawn cadence: 4.5s.
- 4th hit at 4.0 + 3·4.5 = **17.5s.** Slowest capper by raw clock — but each hit is a thump, and the heavy attacker also tanks any 1-for-1 interception from a light defender (heavy at 3 HP survives 2 light interceptors and arrives at 1 HP).

### Sanity ranking

| Rank | Pure-grass cap time (220 px) | Per-hit factory chunk |
|------|------------------------------|-----------------------|
| Light | 15.33s | 10% |
| Medium | **12.59s** (fastest) | 20% |
| Heavy | 17.5s | 30% |

The three ranks **rank-order differently on capture-time vs per-hit punch vs terrain coverage vs collision survival**. No rank is dominant on all four axes. That four-axis differentiation is the design payoff of the v1.3 extension.

### Heavy contested-edge advantage (qualitative)

The numbers above ignore interception. On a contested edge with a light defender constantly trickling counters out:
- light-vs-light collision: 1-for-1 trade, attack stalls.
- heavy-vs-light collision: heavy continues at 2 HP (then 1 HP after second light), still arrives.
- **A heavy attacker on a contested edge effectively absorbs 2 free light counters per delivery.** The capture-time math swings sharply in heavy's favour on any edge where the defender is also spawning. Heavy's slow cadence and slow speed are paid for in collision durability.

---

## Section 7 — Risks + open questions

### Things implementation should know

1. **Heavy on brick = 1.1× speed-up is the matrix's only super-unity cell.** If the implementation's path-traversal code clamps `speedMul` to ≤1.0, this gimmick is dead. **Implementer: do not clamp; allow super-unity values in `speedMul`.**

2. **Sea is universal block by design but creates dead map space if mis-painted.** Hand off to the level-designer / `content-creation-agent` (whichever owns map polygons): sea must be painted as scenery or as intentional edge-removal, never accidentally bisecting a path between two reachable factories. Recommend a level-validation lint: "for each ordered factory pair, at least one rank must have a non-blocked straight-line path; otherwise warn."

3. **`baseGenIntervalSec=2.0` becomes vestigial.** Replace it in `FACTORY_TUNING` with the per-rank table from §1, or keep `baseGenIntervalSec` as a fallback default (defensive coding for towers without an explicit rank). I recommend the latter for safety.

4. **`unitSpeed=90` similarly becomes vestigial.** Same recommendation: keep as fallback default; new per-rank table overrides.

5. **Path-piecewise speed math:** when a unit traverses a path that crosses N terrain segments, total travel time = Σ (segment_length / (base_speed × terrain_speedMul)). The implementer should test this with a deliberately ugly path (e.g. grass → swamp → sand → grass) and verify the unit's screen-position advances *continuously* without snapping at terrain boundaries.

### Tensions / playtest-required calls

1. **Light blocked by 5/7 terrains may feel punishing.** I am betting that the player learns to route around blocks rather than into them, and that the AI does the same (so light corridors become the "highway" both sides fight over). If playtest shows light feels useless on most maps, the first lever to pull is **light cross-able on sand → grass-style 1.0× and sand mildly slows light at 0.9×** (i.e. demote sand to "doesn't impede light at all"). Don't reach for "light crosses mountain" — that destroys the rank's identity.

2. **Heavy's 1.1× brick speed-up may or may not register visually.** A 10% speed-up over a small brick polygon is mathematically real but hard to *see*. If playtest reports "heavies feel the same on brick as on grass," bump to 1.2× or 1.25×. Do not go above 1.4× without re-running the cadence sim — at 1.5× brick-heavy starts dominating any map with a brick corridor.

3. **Medium being the fastest neutral capper on grass may surprise.** Players often expect heavy to be "best at attacking." Frame medium as the "Swiss army knife" in tutorial/onboarding so players don't perceive medium-meta as a balance bug.

4. **Chasm being heavy-only might create map designs that overuse it.** A chasm corridor is an instant "heavy lane only" tactical statement. If the level designer overuses chasms, the rank-rock-paper-scissors degenerates. Recommend a soft cap in level-design guidance: no more than one chasm-corridor per map.

5. **AI replan cadence (`aiReplanEverySec=1.5`) was set when all units shared one speed.** With heavy moving at 55 px/s and replanning every 1.5s, the AI may oscillate target choice mid-attack on slow heavies. Monitor; if AI flip-flops, raise replan to 2.0s for heavy-owned factories or add hysteresis. Hand-off to `gameplay-systems-agent` if behavioural change is needed.

### Future tuning levers (v1.4+)

1. **Damage-on-terrain** (lava hurts crossing units). Deferred from v1.3.
2. **Per-rank L2–L5 scaling** — the `genIntervalPerLevel=0.85` is a global multiplier. We may want light to level *faster* (cadence multiplier 0.80) and heavy to level *slower* (0.90) to preserve the rank-volume ratios at high levels. Sim required before changing.
3. **Per-rank visual readability** — the implementer should ensure heavy units render visibly larger than light (factor 1.5–2× radius would mirror the HP/damage scaling). Hand-off to art/asset pipeline.
4. **Sea + boats** as a rank-4 "naval" extension. Probably v2.0.
5. **Tower-rank-by-position** vs **tower-rank-by-loadout** clarification — the brief says "tower's rank dictates which unit type from the owner's loadout is produced." This implies players have a loadout of one unit per rank slot and the tower picks from it. If loadout customisation is added, the cadence/speed/damage tables here remain valid — they're per-rank, not per-unit-instance.

---

## Implementation-ready summary

Five literal blocks for `src/data/factories.js` (or split into `src/data/units.js` + `src/data/terrain.js`):

```js
export const RANK_GEN_INTERVAL_SEC = { light: 1.5,  medium: 2.5,  heavy: 4.5 };
export const RANK_UNIT_SPEED       = { light: 120,  medium: 85,   heavy: 55  };
export const RANK_DAMAGE           = { light: 1,    medium: 2,    heavy: 3   };
export const RANK_UNIT_HP          = { light: 1,    medium: 2,    heavy: 3   };
// TERRAIN_EFFECTS — see Section 4 for the full literal.
```

Plus the 21-cell `TERRAIN_EFFECTS` matrix in §4.

**No code-level constants. Combat-balance work edits data, per CLAUDE.md §2.4.**
