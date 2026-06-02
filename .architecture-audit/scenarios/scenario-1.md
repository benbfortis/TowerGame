# First Blocker (Scenario 1)

**Focus:** line-of-sight chaining
**Difficulty:** easy
**Clever moment:** The player realizes that n1's position blocks direct sight to A, so they must capture a factory standing in the way.

## Intended solution
1. T+0s: drag P → n1.
2. T+1.83s: first light arrives at n1 (150px / 120px·s⁻¹) — captures (n1 pop=0→1). n1 becomes player-owned.
3. T+2.13s: second light arrives; n1 emits first light toward n2 (now visible).
4. T+3.30s: light arrives at n2 (220px / 120px·s⁻¹ from n1); captures. n2 is player-owned.
5. T+3.60s: second light from n1 arrives; n2 emits toward A.
6. T+4.40s: lights at n2 accumulate. Steady emission begins.
7. T+5.27s: first light reaches A (290px / 120px·s⁻¹ from n2). A pop drops 1.
8. Win at T+~8.5s (A pops to 0, captured, pop=1, game ends).

## Why it's clever
The factory bodies themselves form LOS blockers—a physical wall. The player's first instinct is to push forward; this scenario teaches that you must capture *intervening* factories even if they're neutral, just to unlock the sightline. It's a spatial reasoning puzzle disguised as a combat puzzle.

## Anti-solutions (fail traces)
1. **Try to drag n1 directly from P:** Light emitted from P can't reach n1 (path blocked by factory body). P has no LOS to n1. Player gets confused; eventually realizes they must capture n1 first.
2. **Drag n3/n4 instead:** Wastes pop on a detour that doesn't help. n3/n4 can't see A either. Player realizes the only winning path is vertical through n1→n2.

## AI behavior expectations
A does nothing (0 outgoing edges, can't emit units). Player has unlimited time to solve.

## Risks
New players may not understand factory LOS bodies block sight. Quick tutorial tooltip on startup recommended.

