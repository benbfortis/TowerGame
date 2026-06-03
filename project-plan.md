# TowerGame1

## Experiment 1: Vanilla Tower-Capture RTS (single screen, AI opponent)

**Problem:** No existing baseline for the towergame concept — need to know whether the core idea (passive single-screen tower-capture RTS, drag-to-invade, level-up-on-hold) is fun on its own before layering anything else on top.

**Hypothesis:** A stripped-back, passive RTS that fuses *Tower Control* (hypercasual mobile), *Advance Wars*, and *Z* (Bitmap Brothers) — single-screen map, factory nodes, drag-to-invade, mutual-destruct on shared paths — is fun to play against a basic AI opponent.

**Solution:** Build the first version with the following ruleset:
- **Map:** single screen, a series of nodes; each node has a factory on it.
- **Setup:** player starts with 1 factory at their end; AI opponent starts with 1 factory at the opposite end.
- **Win condition:** capture the opponent's base factory.
- **Invasion mechanic:** drag from one of your factories to any other factory to establish an "invasion" — your factory sends its generated units to the targeted factory.
- **Capture:** each factory has 10 health; after 10 units hit a factory, you claim it.
- **Levelling:** every 5s a factory is under your control, it levels up; level-up slightly increases its generation rate.
- **Idle behaviour:** if a factory has no target, it does not deploy troops.
- **Collisions:** if your invasion path is the same as an enemy invasion path, the troops attack each other on the path and mutually destruct.
- **Opponent:** AI-controlled.

**Measure:** Play it.

**Findings:**
- ✅ **Feels ok immediately.** Baseline ruleset is landing as a starting point.
- ⚠️ **Single-target invasions are too limiting** — need to be able to send from one factory to multiple sites at once.
- ⚠️ **Map is too plain** — needs obstacles to make movement and pathing more interesting.
- 💡 **Insight (durable):** **responsiveness and UX are going to be critical** on this game. The interaction loop is so tight (drag, watch, redirect) that any input lag or unclear feedback will tank the feel.

---

## Changelist v1

### Invasion Mechanic
- **Multi-target invasions** — a single factory must be able to send its output to multiple target factories simultaneously, not just one.

### Map / Level Design
- **Add obstacles** to the map — terrain features that block or shape invasion paths and make the single-screen layout more interesting.

### Durable Project Rule
- **Responsiveness and UX are first-class.** Every interaction (drag, target, retarget, cancel) must feel snappy and unambiguous. This is the lens for every future feature on this game.

---

## Experiment 2: Unit & Terrain Keywording with Advance Wars–style RPS

**Problem:** Base ruleset is symmetric and flat — every unit is the same and terrain is undifferentiated. Without typed interactions, strategic choice collapses to "send more, send faster," and obstacles (from Changelist v1) only block rather than shape decisions.

**Hypothesis:** Adding a keyword/tag system to units, plus terrain keywords, plus an *Advance Wars*–style rock-paper-scissors relationship between unit types, will create real strategic depth — pathing choice, factory-type choice, and invasion-target choice all start to matter beyond raw throughput.

**Solution:**
- **Unit keywords** — tag each unit type with attributes that drive interactions.
- **Terrain keywords** — tag map tiles / obstacles with attributes that interact with unit keywords (movement cost, cover, type advantage, etc.).
- **Rock-paper-scissors matchups** — *Advance Wars*–style triangle(s) between unit types, so the answer to "which units do I produce / send where" depends on what the opponent is fielding and what terrain the path crosses.

**Measure:** Play it.

**Findings:** Pending.

---

## Changelist v2 — First Gameplay Slice (concretizes Experiment 2)

> User: *"this is the first gameplay slice to solve some initial problems"* — the concrete spec for the unit/terrain keyword + RPS system.

### Terrain Types (block or slow units)
- **Brick**
- **Mountain**
- **Sea**
- **Sand**
- **Chasm**
- **Swamp**
- **Lava**

Each terrain blocks or slows units differently. Specific units are designed to traverse specific terrains easily — terrain ↔ unit interaction is the RPS surface.

### Unit Ranks (3-tier)
- **Light** — generates fastest.
- **Medium** — generates slower.
- **Heavy** — generates slowest.

Generation speed is inversely scaled with rank.

### Unit Assignment
- **One unit type per tower.** Each tower produces a single unit type.
- **Pre-combat loadout.** Before combat, the user selects which unit (from their unit collection) is assigned to each of the three ranks (light / medium / heavy).
- **Capture inheritance.** When the player captures a tower, it produces the unit they've assigned to that tower's rank — e.g. capturing a Light tower spawns whatever the player slotted as their Light unit.

### Example Unit Set
- **Light:** Worker
- **Medium:** Bulldozer
- **Heavy:** Demolition Ball

### Unit Collection (implied)
- The player has a **collection** of units to draw from. The pre-combat assignment screen pulls from this collection.

---

## Playtest Findings (Post-Changelist v2)

**Measure:** Play it.

- ✅ **Feeling better.** The keyword slice is moving the game in the right direction.
- ✅ **Multi-unit choice is pretty cool feeling.** Pre-combat assignment of units to ranks is landing as a real decision.
- ⚠️ **Cancellation is missing.** Need to be able to cancel an established invasion — currently no way to call troops off a target.
- ⚠️ **Terrain is complex and tricky** — current implementation is too hard to read / interact with and must be changed. (Approach TBD — needs design rework, not just tuning.)

---

## Playtest Findings (Next Pass)

**Measure:** Play it.

- ✅ **Multiarrow feels cool.** Multi-target invasions (Changelist v1) are landing well in play.
- ⚠️ **Enemy AI power makes this suck a bit.** AI is too strong / too efficient — degrades the play feel.
- 💡 **Design principle (proposed):** **no simple way to win immediately.** The game should not allow a single dominant opening / shortcut path to victory; runs need to require sustained decision-making.

---

## Experiment 3 (Hypothesis): CO Powers (Advance Wars–style)

**Problem:** Enemy AI is currently too strong, and the game lacks a counter-lever the player can pull when behind. The "no simple way to win immediately" principle means the player also needs *some* way to swing momentum back without it being a one-shot exploit.

**Hypothesis:** Adding *Advance Wars*–style **CO powers** (a charge-based commander ability that the player triggers at key moments) will help mitigate the AI-power problem — giving the player a meaningful comeback / swing tool without trivialising the game.

**Solution (sketch):** TBD — design exploration needed. Open questions: what charges the CO meter (time, units lost, factories held, captures, damage dealt?); what shape the powers take (global buffs, terrain effects, unit summons, instant-capture aids); how many COs / per-CO identity; whether the AI also gets COs.

**Measure:** Play it.

**Findings:** Pending.

---

## Changelist v3 — Combat & Factory Rules Rewrite + Level 1 Test Scene

> User: *"ok the conflict stuff isn't working. Here's the new rule."* — this is the current brief. Replaces earlier "shared invasion path = mutual destruct" rule.

### Contested Lines (replaces mutual-destruct rule)
- **Definition:** if both you and the opponent have an invasion line where both lines involve the **same two factories**, that line is a **"contested line"**.
- **Visual:** shown as **half your color and half theirs** along the path.
- **Combat:** units **kill each other as they collide, or do combat**.

### Factory Population & Production
- **Every unit generated inside a factory raises that factory's population by 1.**
- **Every multiple of 10 population** increases factory production by **+10%**.
- **Bonus only triggers at the 10% boundaries** — not continuously, not at sub-10 increments.

### Friendly Routing (factory → factory)
- **Factories can be routed to other friendly factories.**
- **Unit conversion on transfer:** units sent to a friendly factory get **converted to whatever that factory makes**, at a **consummate rate** (i.e. proportional to relative production speeds — slower-producing destination = fewer units after conversion).

### Multi-Arrow Emission
- **Outward invasion = emit at generation speed.** A factory with an outward invasion emits units at its generation speed.
- **Multiple arrows = emit in all outward directions at generation speed**, until the factory **cannot sustain that** any more.
- **Falls back to emitting only as it generates** once the over-emission can't be sustained.

### Level 1 — Test Scene
- **Build a test scene of 6 factories** as the **first level**, expressly to verify the agent understands the new rules.

### Status
- This is the **current brief** — supersedes the conflict mechanic from Experiment 1.

---

## Playtest Findings (Post-Changelist v3)

**Measure:** Play it.

- ✅ **Linear approach immediately feels interesting.** The rewritten conflict / contested-line model lands fast — the play feel clicks early.
- ✅ **Cancelling and restarting feels good.** Invasion cancellation (flagged as missing post-v2) is now in and is satisfying to use — the retarget / re-decide loop reads well.
- 💡 **Insight (direction):** **this could work in a larger multiplayer format.** The mechanics scale conceptually beyond 1v1 — worth exploring multi-player variants.

---

## Experiment 4 (Hypothesis): Larger Multiplayer Format

**Problem:** Current shape is 1v1 vs. AI. The contested-line + multi-arrow + friendly-routing mechanics feel like they have headroom — a bigger player count and bigger map might unlock a different game.

**Hypothesis:** A larger multiplayer format (3+ players, more factories, bigger map) will showcase the contested-line and friendly-routing mechanics in a way 1v1 can't — alliances / cross-cutting contested lines / regional control should emerge naturally.

**Solution (sketch):** TBD. Open questions: player count cap; map scale; whether AI fills empty seats; whether friendly-routing extends to allies; victory condition (last-base-standing vs. timed dominance vs. capture-all).

**Measure:** Play it.

**Findings:** Pending.

---

## Experiment 5 (Hypothesis): Co-op vs Overweighted AI Opponents

**Problem:** Multiplayer (Exp 4) is being framed as PvP. But the same mechanics (friendly routing, contested lines, multi-arrow emission) might shine even harder in a co-op shape — players coordinating against a much stronger opponent.

**Hypothesis:** **This could be a social opportunity against big overweighted computer opponents.** A group of human players vs. a deliberately overpowered AI (way more factories / faster generation / earlier production bonuses) creates a co-op coordination loop — friendly routing becomes the literal social verb, and contested lines against a shared enemy give the team something to fight together.

**Solution (sketch):** TBD. Open questions: AI overweighting knobs (factory count, generation rate, starting population); team size; whether players share a unit collection or each bring their own; comms surface (pings on factories?); win condition (survive N minutes vs. capture AI base vs. hold majority).

**Measure:** Play it.

**Findings:** Pending.

---

## Experiment 6 (Hypothesis): Tower Cohesion, Unit Fungibility, and the Puzzle-Strategy Pivot

**Problem:** **Tower cohesion and unit fungibility are going to be an issue.** Right now any tower can absorb any unit and any unit can do roughly the same job, which collapses two things at once:
1. **Runaway power** — captured factories compound generation too easily, and there's no friction on snowballing.
2. **Unit choice doesn't count** — if units are fungible, the pre-combat assignment (Changelist v2) stops mattering.

**Hypothesis (multi-part, unresolved):**
- **Map size:** big maps might dilute snowballing — but **small maps are more fun**. There's a real tension here.
- **Terrain as barrier:** putting **barriers between factories in the terrain** could turn this from a flow game into a **puzzle-strategy game** — routing becomes the interesting decision, not throughput.
- **Authored tactical scenarios** beat purely procedural maps for this problem. A handcrafted (or agent-crafted) puzzle scenario gives the player the "I figured it out" beat that pure throughput games can't.

**Solution (proposed — tooling-first):**
- **Build a dedicated tactical-scenario-designer subagent** for this game setup. Responsibilities:
  - Generate scenarios that **make the user feel clever**.
  - Every scenario must be **solvable via the right factory/invasion routing**.
  - Use the **terrain barriers** as the puzzle surface.
- Use that subagent's output as the level-design pipeline so the scenario corpus scales with experimentation.

**Open questions (explicitly unresolved):**
- Net map size — small is more fun but may make snowballing worse; need a way to keep small without runaway power.
- How to make tower-type cohesion / unit choice *count* without making it just stat soup.
- Whether the puzzle framing replaces the RTS framing or layers on top of it.

**Measure:** Play it (against scenarios produced by the new subagent).

**Findings:** Pending.

---

## Changelist v4 — Capture Population Fix + Unit Economy / Conversion Ratios

> User: *"factories shouldn't go to 5 when you take them. Their population should directly correlate to the rules."* Plus the rank economy spec.

### Capture Population Bug Fix
- 🐛 **Captured factories must not default to population 5.** Captured factory population must **directly correlate to the rules** — i.e. **whatever units actually arrived to take it.**
- **Example:** if you capture a factory with 1 unit, it starts at **population 1**, not 5.

### Unit Rank Economy (concrete ratios)
- **Light = 1 unit baseline.**
- **Medium = 3 (light) units' worth.**
- **Heavy = 8 (light) units' worth.**
- This ratio governs all cross-rank interactions: capture cost, population accounting, and friendly-routing conversion.

### Friendly Routing — Conversion Now Explicit
- **Forwarding troops must convert them to whatever the destination factory produces.** (Refines Changelist v3's "consummate rate" wording with concrete numbers.)
- **Example:** sending **3 light units → a medium factory** produces **1 medium unit** that the medium factory then emits on its invasion.
- Implication: light feeders → heavy producer = 8:1 conversion. Conversion happens **on receipt at the destination**, not on emission from the source.

---

## Playtest Findings (Post-Changelist v4)

**Measure:** Play it.

- ✅ **Game is feeling ok straight away.** The capture-population fix + concrete rank ratios land cleanly.
- ⚠️ **Needs a bit more strategy.** Mechanics are working but the strategic surface is still thin — reinforces Experiment 6 (terrain barriers / puzzle-style scenarios) as the next lever to pull.

---

## Playtest Findings (Post-Terrain & Unit Variety Pass)

**Measure:** Play it.

- ✅ **Feels a bit more interesting now with different units and terrains.** Variety is paying off — the moment-to-moment is improving.
- ⚠️ **Dominant strategy collapses to "hammer the most circles possible."** Unless there is a **very definite problem** in the scenario, the fastest win is just direct mass capture — no reason to think laterally.
- 💡 **Problem framing:** **there needs to be another layer of strategy, however thin** — even a small additional pull or constraint is enough; doesn't need to be deep, just needs to exist so that "hammer everything" isn't always the right answer.

---

## Experiment 7 (Hypothesis): A Thin Second Strategic Layer

**Problem:** With the current ruleset, the dominant strategy is brute-force capture — fan out, hit as many factories as possible, win. There is no reason to make a non-greedy decision. The game needs **another strategic layer, however thin**, to give the player something other than "more circles" to optimize for.

**Hypothesis:** A single, lightweight second-axis mechanic — *anything* that creates a non-trivial choice beyond "go wide" — will unlock the strategic surface without adding complexity bloat. Candidates (to explore, not all):
- **Objective tiles** on the map (hold X for Y seconds → win bonus / power unlock).
- **Resource nodes** that fuel a CO-power-style ability (ties into Exp 3).
- **Per-factory specialisations** that reward focused build-up over wide capture.
- **Time/turn pressure** that punishes over-extension.
- **Asymmetric victory conditions** (e.g. survive vs. capture-all).

**Solution (sketch):** Pick the cheapest, thinnest version of one of the above and try it. The bar is "the player has to make a choice between two paths" — depth can come later.

**Measure:** Play it.

**Findings:** Pending.

---

## Playtest Findings (Unit-Variety vs. Map-Quality Gap)

**Measure:** Play it.

- ✅ **Different units are interesting.** Unit variety (ranks + per-rank type assignment) is doing its job — the units themselves are engaging.
- ⚠️ **Maps need to be way cooler for this to work.** The unit variety is being wasted on bland maps. Map quality is now the load-bearing bottleneck — without better-authored scenarios, the units don't get to shine.
- 💡 **Reinforces Experiment 6:** the **tactical-scenario-designer subagent** is the right next move. Map design has overtaken unit/mechanic work as the highest-leverage thing to fix.

---

## Playtest Findings (Drag UX on Uncontested Nodes)

**Measure:** Play it.

- ⚠️ **Simple dragging on a load of uncontested nodes really sucks.** When a chunk of the map is just "drag arrows to claim free factories," it's pure friction — no decision, no resistance, just busywork.
- 💡 **Implication (two complementary directions):**
  - **UX-side:** the drag-to-claim flow needs a faster path for trivially uncontested nodes (bulk targeting / auto-claim / chain-drag — TBD).
  - **Design-side:** scenarios shouldn't *have* long stretches of trivially uncontested nodes in the first place. Reinforces Experiment 6 (tactical scenarios) and Experiment 7 (second strategic layer) — both reduce the "boring drag" surface area.
- ⛓️ **Ties back to the durable rule** from Changelist v1: *responsiveness and UX are first-class.* The drag-on-uncontested case is the current worst offender.

---

## Playtest Findings (Pacing, Meta, and Audience-Drift Concerns)

**Measure:** Play it.

- ✅ **Feels interesting with the new unit types.** Unit-variety thread continues to land.
- ⚠️ **A little too fast to drink it in.** Pacing is currently too quick — the player doesn't get to appreciate decisions before they're resolved. Needs a slowdown lever (per-action time, generation rate, map scale — TBD).
- 💡 **Wants a meta layer.** "I want to earn these units." Unit acquisition / progression outside the match is missing — currently units appear without context.
- ❓ **PvP curiosity.** *"I want to maybe feel like this is pvp? Don't know for sure."* — open question about whether the human-vs-AI framing should give way to PvP (links Exp 4 multiplayer).
- ⚠️ **Audience-drift risk.** *"It's getting somewhere strategic that may be too hardcore."* — the game is gaining strategic depth but may be crossing out of its original casual / hypercasual reference points (Tower Control). Worth watching.

---

## Experiment 8 (Hypothesis): Meta Layer — Earning Units

**Problem:** Units currently appear with no context. The player has no investment in *which* units they have because they didn't earn them. Combined with the "too-fast pacing" finding, the match itself doesn't carry enough weight to make individual unit choices feel meaningful.

**Hypothesis:** A meta layer where units are **earned** — through play, victories, or some other persistent progression — will (a) give matches stakes beyond the match itself, (b) make unit choice feel like an expression of progress, and (c) give the player a reason to come back. Combined with a pacing slowdown, the moment-to-moment decisions also start to feel weightier.

**Solution (sketch — TBD):**
- Unit unlock / earn loop (post-match rewards, currency, milestones?).
- Possibly tied to PvP results (Exp 4) if that direction is taken.
- Needs to avoid pushing the game further into "hardcore" territory — see audience-drift risk above.

**Open questions:**
- Does the meta-layer answer also resolve the PvP-vs-AI question, or are they orthogonal?
- How to add strategic depth + a meta layer without losing the casual feel that made the original drag-and-claim concept land.

**Measure:** Play it.

**Findings:** Pending.