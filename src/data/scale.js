// scale.js — universal game-tempo multiplier.
//
// Higher GAME_SCALE means BOTH bigger numbers AND faster cadence:
//   • All pop fields (base seed, max pop, popPerTier, capture seed) multiply.
//   • All gen intervals divide (so emit rate scales up linearly with GAME_SCALE).
//   • Time-to-deplete-stockpile is approximately preserved (size × rate cancels).
//
// In effect the game gets PROPORTIONALLY bigger and proportionally faster, so
// the same strategies work but with more units on screen and tighter timing.
//
// Reference scale values:
//   1   — v1.10-style baseline (small numbers, deliberate pace).
//   5   — current default. Mid-size, mid-tempo.
//   10  — v1.21/v1.22 turbo (huge battles, very fast).

export const GAME_SCALE = 5;
