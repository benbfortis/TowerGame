# Sieve Run (Scenario 16)
**Focus:** mass sieve
**Difficulty:** medium-hard
**Clever moment:** The player feels clever when they realize starting heavy is the only loadout where the brick gates speed you up while soaking Yellow's snipers.

## Intended solution
1. T+0s: P is heavy (siege/demolitionBall). Heavy gets 1.1× on brick — the three gates speed it up, not slow it.
2. Drag P -> n1. First heavy emits at T+9s, travels ~170px through gate 1 at 1.1× factor — arrives ~T+13s.
3. n1 captures. Chain n1 -> n2 (medium). High-HP heavies tank Yellow sharpshooter fire.
4. n2 captures ~T+25s. n2 emits mediums (medium also crosses brick, slower).
5. Drag n2 -> A. Mix of heavies and mediums grinds A.
Win at T+~110s.

## AI behavior
A's first replan picks n3 (nearest neutral). Y fires at any player units in central LOS — heavies have enough HP to survive the run. Y's targets are the centre lane units.

## Risks
Anti-solution: light-loadout player. Lights are slowed by brick AND die to Y's sharpshooters. Heavy is the design-intended loadout; the puzzle teaches that loadout choice matters.
