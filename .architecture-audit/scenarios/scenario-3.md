# Pipeline (Scenario 3)

**Focus:** forwarding chains and cost-economy stacking
**Difficulty:** medium
**Clever moment:** The player discovers that lights accumulating at a medium factory don't just die—three lights' pop (3×1=3) converts to one medium's cost (3), and the medium can then push a heavy. The chain amplifies the spawn rate if configured right.

## Intended solution
1. T+0s: drag P → n1 (light).
2. T+1.25s: first light arrives (150px / 120px·s⁻¹); n1 captured.
3. T+1.75s: P emits second light; n1 emits light toward n2 (medium).
4. T+2.88s: light arrives at n2 (196px / 120px·s⁻¹); n2 captured, pop=1.
5. T+3.25s: second light from n1 arrives n2; pop=2.
6. T+3.60s: third light arrives n2; pop=3 → n2 emits medium.
7. T+5.15s: medium arrives n4 (heavy, 280px / 85px·s⁻¹ through sand slowdown ~0.85x → 102px·s⁻¹ effective, 2.75s). n4 captured, pop=1.
8. T+6.00s: lights continue flowing P→n1→n2. Mediums begin emitting steadily.
9. T+7.20s: heavies begin emitting from n4 (8-cost units). Heavy arrives n5 (distance 180px / 55px·s⁻¹ = 3.27s) T+10.47s.
10. Win at T+~12.5s (chain carries heavy to A, A captured).

## Why it's clever
The puzzle introduces **cost-unit stacking.** Lights individually are weak; three grouped at a medium factory equal one medium's emission cost. The player's "clever moment" is recognizing that factories don't just *receive* pop—they *convert* it via rank emission rules. A light-fed medium is a cost amplifier; medium-fed heavy is the final amplifier. Building the chain is the puzzle.

## Anti-solutions (fail traces)
1. **Try to feed n3 or n5 directly from P:** P can't see them (no LOS). Wastes time.
2. **Spam lights everywhere:** Lights alone never reach A (too far, too slow). Player must consolidate into mediums/heavies.
3. **Ignore n2's medium rank:** Try to use n1 (light) to attack n4 (heavy) directly. Lights deal 1 damage per arrival; heavy has pop>1 always. Stalls forever.

## AI behavior expectations
A does nothing (isolated on right side, no incoming edges). Player has ~15s to build the chain before population plateaus if sub-optimal.

## Risks
Cost-unit conversion is abstract; players new to v1.9 mechanics may not intuit that "3 lights → 1 medium" is intended behavior, not a bug. Tutorial or first-scenario should establish this rule clearly.

