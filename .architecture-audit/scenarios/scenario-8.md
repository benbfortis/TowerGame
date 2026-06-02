# Quick Strike (Scenario 8)
**Focus:** race-to-centre
**Difficulty:** easy-medium
**Clever moment:** The player feels clever when they realize emitting a single medium beats spamming lights to capture the centre heavy first.

## Intended solution
1. T+0s: P is medium (5s cadence). Drag P -> n1 immediately.
2. P emits its first medium at T+5s. Travels ~360px / 100 = ~3.6s. Arrives ~T+8.6s.
3. Medium hits n1 for 3 dmg (sapper / bulldozer factoryDamage tier). n1 starts at pop 0 -> captured to player at pop 1.
4. Stream more mediums into n1 to feed it. Once n1 hits pop 8 (heavy emit cost), it begins streaming heavies at A.
5. Heavies push A to capture.
Win at T+~80s.

## AI behavior
A also emits mediums starting T+5s. The race is symmetric — first to capture n1 wins. AI replan picks n1 immediately. Player must not stall.

## Risks
If both player and AI miss the n1 window the game stalls. Brick side walls ensure both must come through the centre; no flank routes exist.
