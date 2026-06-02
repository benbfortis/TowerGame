# Momentum (Scenario 5)

**Focus:** multi-chain forwarding, terrain traversal, contested defense
**Difficulty:** hardest
**Clever moment:** The player must build two simultaneous chains—one feeding n4 (heavy spawner) to blast through the central chasm, and another defending n5 (contested medium) against A's counter-units—while balancing pop between offense and defense. The "moment" is realizing that heavies, unlike lights, *can cross* chasm (0.5x speed), so the chasm becomes an *advantage* for the player who builds the heavy spawner first.

## Intended solution
1. **Phase 1 (T+0–4s): Capture left column (P→n1→n2→n3).**
   - T+0s: drag P → n1.
   - T+1.25s: light arrives n1; captured.
   - T+1.75s, T+3.25s, T+4.75s: three lights emitted from n1; second arrives T+2.45s, third T+3.95s.
   - T+3.88s: second light from n1 arrives n2; pop=2.
   - T+4.38s: third light arrives n2; pop=3 → n2 emits medium.
   - T+6.45s: medium arrives n3 (distance 235px, 85px·s⁻¹ but sand 0.85x → ~100px·s⁻¹ effective, 2.35s); n3 captured.

2. **Phase 2 (T+4–7s): Build heavy spawner at n4.**
   - T+4.75s: fourth light from P via n1 arrives n2; pop=1.
   - T+6.00s: fifth light arrives n2; pop=2.
   - T+6.50s: sixth light arrives n2; pop=3 → second medium emitted.
   - T+8.25s: medium arrives n4 (distance 310px, 85px·s⁻¹, ~3.65s). n4 captured, pop=1. n4 is now heavy-rank spawner.

3. **Phase 3 (T+6–9s): Defend n5 against A's counter.**
   - T+5.0s: **A's gen tick.** 1 medium spawned (A ranks medium naturally). Sent toward n5 (distance 256px, 85px·s⁻¹ = 3.0s). Arrives T+8.0s.
   - T+6.5s: Redirect lights from P→n1→n3 to attack n5 defensively. Drag P → n1, then n1 → n3 → n5.
   - T+8.0s: A's medium arrives n5. n5 pop was 0 → captured by A.
   - T+8.5s: First light from P via (P→n1→n2→n3→n5) arrives n5 (distance sum ~850px, avg speed 100px·s⁻¹ effective in sand/swamp, ~8.5s). n5 recaptured by P, pop=1.
   - T+9.0s: A's second gen tick. Another medium spawned; sent to n5. Arrives T+12.0s.
   - T+9.2s: second light arrives n5; pop=2.
   - T+9.7s: third light arrives n5; pop=3 → n5 emits medium (yes, P owns it now). Medium sent toward n6 or n8 as a feeder.

4. **Phase 4 (T+9–15s): Push heavies through chasm.**
   - T+10.5s: n4 (heavy spawner) has accumulated pop=8 (from n2 and n3 forwarding). First heavy emitted toward n6 (distance 148px, 55px·s⁻¹ = 2.69s). Arrives T+13.19s.
   - T+12.0s: A's medium arrives n5, but P owns it; killed. n5 pop still ~2–3 from fresh lights.
   - T+13.19s: P's heavy arrives n6; n6 captured (was neutral). n6 emits toward A (distance 189px / 55px·s⁻¹ = 3.44s). **But wait—n6 to A path is blocked by chasm. Heavy can cross (0.5x = 27.5px·s⁻¹).** Effective travel T+6.88s. Arrives A T+20.07s.
   - **Actually, re-examine: n6 to A distance is 189px. Heavy at 0.5x = 27.5px·s⁻¹ (chasm traversal). Time = 189/27.5 = 6.87s.**
   - T+14.00s: Second heavy from n4 emitted (pop recharged). Arrives n6 T+16.69s.
   - T+16.69s: Second heavy emitted from n6 toward A. Heavy speed through chasm 0.5x = 27.5px·s⁻¹. Arrives A T+23.6s.
   - **Simplify: if player builds sufficient heavy feed to n4 and continually pushes through n6→chasm→A, A falls by T+~18–22s.**

5. **Win condition:** A pop reaches 0.

## Why it's clever
This puzzle stacks **four orthogonal mechanics:**
- **Cost-unit forwarding chains** (lights→mediums→heavies).
- **Terrain routing** (mediums threaded through sand, heavies crossing chasm).
- **Contested defense** (n5 flips back and forth; player must stabilize it).
- **Rank leverage** (heavy's 0.5x chasm speed becomes a *strategic advantage* vs light blocking).

The "clever moment" is when the player realizes: "I'm stuck behind the chasm? No—my heavy goes *through* it. I'm actually safer than A because A can't push through easily." This flips perceived disadvantage into tactical edge.

## Anti-solutions (fail traces)
1. **Defend n5 too heavily, starve n4:** Over-invest in lights at n5, not enough at n4 heavy-spawner. A floods n5 eventually; even if P holds it, P never builds enough heavies to push through A. Stalemate → loss as A's accumulated pop grows.
2. **Ignore n5 entirely, rush n4:** A captures n5, then uses it as a secondary forward base to attack n3 or n2 from behind. Cuts P's supply line. Pop dries up; n4 never gets fed. Loss.
3. **Send lights through chasm:** Lights blocked; never reach n6/A. Wastes time. Eventually player realizes heavies are required.
4. **Route through brick corridor on A's side:** Tempting detour (brick offers 1.1x heavy speed). But A controls that region; P's units are ambushed by A's defenses. Inefficient vs chasm route.

## AI behavior expectations
- T+5.0s: A spawns 1 medium toward n5.
- T+10.0s: A spawns 1 medium toward n5 or n6 (if n6 captured by P, A may pivot to defensive replan).
- T+15.0s: A reassesses. If A sees heavies incoming, A may try to capture n7 or n8 as a fallback base. Or A pushes harder at n5.
- **Key:** A's slow gen interval (medium = 2.5s) means A falls behind vs a well-fed P chain. A can't out-spawn a coordinated heavy feed. AI must rely on territorial control and chokepoints, not raw production.

## Risks
**Critical:** Chasm traversal speed (0.5x = 27.5px·s⁻¹ for heavy at 55px·s⁻¹ base) makes the path to A *very* long. Heavy from n6 takes ~6.9s to reach A. If n4 is starved and only emits 1 heavy every 4.5s gen tick + cooldown, the game may take >30s, which is tedious.
- **Mitigation:** Playtest timing. If too long, either (a) reduce chasm distance or (b) increase n4 pop-generation rate. May also add a secondary feeder from n2 or n3 directly to n4 to sustain heavy spam.

**Secondary:** n5 contested-defense window is narrow (T+6–12s). If P doesn't notice A's counter or moves slowly, A secures n5 and redirects it toward n2/n3, causing supply collapse. Recommend visual feedback (n5 color blinks or a warning HUD element) when contested factories flip ownership.

