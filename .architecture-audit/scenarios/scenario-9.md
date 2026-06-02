# Backdoor Path (Scenario 9)
**Focus:** backdoor (pathfinding-only)
**Difficulty:** medium
**Clever moment:** The player feels clever when they realize lights can't cross the mountain wall but the long right-flank route reaches A anyway.

## Intended solution
1. T+0s: drag P -> n1 (right flank). Lights cannot cross the mountain — must take the long route.
2. Lights travel ~230px to n1, capture at T+3s.
3. Drag n1 -> n2 (medium, higher up the right flank). Lights chain north.
4. n2 captured at ~T+8s. n2 is medium — once fed, mediums hit harder.
5. Drag n2 -> A. Lights/mediums arrive and erode A.
Win at T+~60s.

## AI behavior
A picks n2 (nearest reachable) on first replan, then n1, then P. AI takes same detour — direct light line to P is mountain-blocked.

## Risks
If the player picked Scout loadout in pre-combat, lights pathfind across mountain cells (faster). This is a feature — Scout loadout players win quicker. Worker-loadout players take the long way and still win — both routes intended.
