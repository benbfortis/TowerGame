# Island Heavy (Scenario 12)
**Focus:** resource island
**Difficulty:** medium
**Clever moment:** The player feels clever when they realize only the heavy at pH can race across the chasm to capture the island heavy.

## Intended solution
1. T+0s: drag pH -> n1. pH is the player's heavy (pop seed 12 / 8 = 1 emit immediately at cost 8). Heavy takes ~5s to cross chasm at 0.5×.
2. Heavy arrives at n1 (the island heavy neutral) ~T+9s. n1 was pop 0 -> captures to player at pop 1.
3. Feed n1 with more heavies from pH. n1 starts emitting heavies once pop hits 8.
4. Drag n1 -> aH (AI's heavy). Heavies fly across chasm, overwhelm aH.
5. n1 + pH -> A finishes.
Win at T+~75s.

## AI behavior
A's first replan picks n1 (island heavy). AI streams its own heavies. Symmetric race; player needs to commit pH first.

## Risks
Anti-solution: sending mediums or lights — they are blocked by chasm and queue uselessly at the edge. The chasm is a hard filter (light/medium blocked, heavy 0.5×). If player only has lights they cannot win — but P is medium and pH is heavy so the loadout permits it.
