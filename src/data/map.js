// map.js — legacy single-export shim. The real scenario registry lives in
// src/data/maps/index.js and exposes SCENARIOS[] (5 puzzles + the test scene).
// main.js imports SCENARIOS directly; this file is kept for any straggling
// `import { MAP } from './data/map.js'` that may exist.

import { SCENARIOS } from './maps/index.js';

export const MAP = SCENARIOS[0];
