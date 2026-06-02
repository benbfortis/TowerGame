# Heavy Gate (Scenario 2)

**Focus:** rank-aware terrain blocking and rank selection
**Difficulty:** easy-medium
**Clever moment:** The player realizes their light units can't push through the mountain, but if they capture the medium factory nearby, a single medium can demolish the barrier and unlock the winning path.

## Intended solution
1. T+0s: drag P → n1 (light).
2. T+1.25s: first light arrives (150px / 120px·s⁻¹); n1 captured, pop=1.
3. T+2.13s: n1 emits light toward n2 (medium).
4. T+3.40s: light arrives at n2 (218px / 120px·s⁻¹); n2 captured, pop=1.
5. T+3.70s: second light from n1 arrives at n2; pop=2.
6. T+4.20s: third light arrives; n2 pop=3 triggers medium emission (cost=3). n2 emits medium toward n4.
7. T+5.05s: medium arrives at n4 (148px / 85px·s⁻¹, no terrain). n4 captured, pop=1. Mountain no longer blocks this path (medium moves through mountain at 0.6x speed).
8. T+5.70s: n2 emits second medium; arrives n4 T+6.55s, pop=4.
9. T+7.00s: n4 emits medium toward A (260px / 85px·s⁻¹ = 3.06s); arrives T+10.06s.
10. Win at T+~11.2s (A pops to 0).

## Why it's clever
The mountain terrain introduces a rank-dependent pathfinding constraint. Lights see no path forward; a medium appears to offer none either until the player realizes that mediums *can* traverse mountains (0.6x speed). The puzzle teaches terrain mechanics through experimentation: "my light is blocked, so I need a heavier unit, and it works."

## Anti-solutions (fail traces)
1. **Try n3 (light):** Lights can't traverse mountain. Paths from n1 to n3 require going around the mountain; n3 to A also blocked. Wastes time and pop; eventually player captures n2 instead.
2. **Spam lights at n4 from P directly:** P can't see n4 (mountain blocks LOS). No units emit.
3. **Send light through mountain terrain:** Blocked. Unit doesn't move.

## AI behavior expectations
A does nothing (pop=1, rank light, no incoming edges, can't emit). P has unlimited time to experiment and learn.

## Risks
Players may not discover medium-traverses-mountain without guidance. If early playtests show confusion, add a tooltip: "Some units are stronger—they may push through obstacles."

