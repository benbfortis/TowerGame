# Choke Tunnel (Scenario 6)
**Focus:** chokepoint
**Difficulty:** easy-medium
**Clever moment:** The player feels clever when they realize the only LOS line to A passes through n1, so holding n1 wins.

## Intended solution
1. T+0s: drag P -> n1. P is light, seeds at pop 12.
2. P emits a light every 3s (pop -1 each emit). First light arrives at n1 (~330px / 120 = ~2.75s).
3. n1 was neutral pop 0, takes 1 hit (light.factoryDamage = 1), captures to player at pop 1.
4. Keep P->n1 flowing. n1 is medium (rank base seed 12 effective, captured at 1 — needs feed). Lights arrive and add pop.
5. Once n1 has 3+ pop and is emitting mediums (5s cadence), drag n1->A. Mediums damage A and capture.
Win at T+~45s.

## AI behavior
First replan: A picks n1 (nearest weakest non-same). AI streams lights at n1 contesting the choke. If player commits early, player wins the race; if player delays, AI takes n1 and the player must over-commit to retake.

## Risks
If player never captures n1, AI strolls down to P. The brick walls block any flanking LOS — there is no alternative route. Solvable but unforgiving on first attempt.
