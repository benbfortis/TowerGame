# Crooked Roads (Scenario 17)
**Focus:** risk/reward routes
**Difficulty:** medium-hard
**Clever moment:** The player feels clever when they realize their loadout dictates which path is fastest — and they can split traffic.

## Intended solution
1. T+0s: drag P -> n3 (long-grass right lane, fastest for lights).
2. Simultaneously drag P -> n1 (short-brick left lane, mediums get less penalty).
3. n3 captures ~T+5s (faster grass). n1 captures ~T+8s (brick slows lights).
4. Chain n3 -> n4 (right). n1 -> n2 (left). Two-pronged approach.
5. n4 captures ~T+15s. Drag n4 -> A. Mediums (from P originally) reach A.
6. n2 captures ~T+20s. Drag n2 -> A. Two-front push.
Win at T+~95s.

## AI behavior
A's first replan picks n4 (closest contested). AI takes the symmetric short route (its own brick-friendly side does not exist — so AI tends to come down through n4). Mountain slab between lanes means AI commits to one side.

## Risks
Anti-solution: all-in on the short lane. Brick slows lights; player loses tempo and AI captures n4 first. Splitting traffic is the design intent.
