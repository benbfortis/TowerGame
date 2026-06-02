# Choke Hold (Scenario 4)

**Focus:** racing to secure a contested factory before opponent's unit arrives
**Difficulty:** hard
**Clever moment:** Both P and A have equal line-of-sight to n3 (the choke). Whoever reaches it first controls the bottleneck. The player must move *fast* and build a medium at n2 before A's medium spawns (T+2.5s gen tick) and seizes n3.

## Intended solution
1. T+0s: drag P → n1 (light, distance 150px).
2. T+1.25s: light arrives n1; captured, pop=1. n1 emits toward n2 (medium, distance 200px / 120px·s⁻¹ = 1.67s).
3. T+2.92s: light arrives n2; captured, pop=1.
4. **T+2.50s: A's gen tick fires. A spawns 1 light → n6 (distance 180px / 120px·s⁻¹ = 1.5s). Light arrives A→n6 T+4.00s.**
5. T+3.42s: second light from n1 arrives n2; pop=2.
6. T+3.92s: third light arrives n2; pop=3 → n2 emits medium toward n3 (contested, distance 188px / 85px·s⁻¹ = 2.21s).
7. T+4.00s: **A's light arrives n6; n6 captured. A emits toward n3 (distance 282px / 120px·s⁻¹ = 2.35s). Arrives T+6.35s.**
8. **T+6.13s: P's medium arrives n3 (0.22s before A's light).** n3 secured by P; pop=1.
9. T+6.35s: A's light arrives n3 but it's now player-owned. A's light is killed (-1 pop to n3, but nonfatal). n3 pop=1, still player.
10. T+7.00s: Second medium from n2 arrives n3; pop=4 → n3 emits toward n4 (distance 187px / 85px·s⁻¹ = 2.20s).
11. T+10.00s: Player's mediums reach A-side factories. Win by T+~14s.

## Why it's clever
This is a **timing race.** Both players can see n3; neither has a path advantage. Victory hinges on P moving *immediately* (no hesitation) and building enough pop at n2 to emit a medium before A's natural spawn cycle. A mistakes here: not racing n3 defensively, or moving slower. The tension is pure: "Am I fast enough?"

## Anti-solutions (fail traces)
1. **Move too slowly (delay drag):** A's light reaches n3 first; A secures the choke. P now feeds A units that kill A's other factories (n4). Likely loss.
2. **Try to contest n3 with lights only:** P's first light arrives n3 T+5.35s (from P→n1→n2→n3). A's light arrives T+6.35s. A's second light (spawned T+5.0s gen) arrives T+7.35s. Two lights kill a light factory quickly. n3 flips to A. P must now fight uphill to recapture.
3. **Ignore n2; feed n3 directly from n1:** Distance P→n1→n3 is longer than P→n1→n2→n3. Slower to build n2, so medium arrives n3 *after* A's light. Lose the race.

## AI behavior expectations
- T+2.5s: A's gen interval fires. 1 light emitted to n6.
- T+5.0s: A's second gen tick. 1 light emitted to n6.
- T+7.5s: A's third gen tick (by now n6 likely captuted by P or still A). If A owns n6, emits light toward n3.
- If A sees n3 flip to P and can't recapture, AI may try to flank via n4 or build a separate line. Exact replanning depends on model.

## Risks
The timing window is **tight: ~6.13s for P to move, and A's light arrives 6.35s.** If P hesitates even 0.5s or misroutes, they lose the race. Playtest must confirm the margin is frustrating but **learnable** (not coinflip-random). If too tight, move A's gen tick to T+3.0s; if too easy, move to T+2.0s.

