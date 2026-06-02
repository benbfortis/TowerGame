// maps/index.js — scenario registry.
// Loaded by main.js to populate the pre-combat scenario selector and the
// random-on-Play pool. New scenarios authored by `towergame-scenario-author`
// are imported here in ascending difficulty order.

import { MAP as TEST_SCENE } from './test-scene.js';
import { MAP as SCENARIO_1 } from './scenario-1.js';
import { MAP as SCENARIO_2 } from './scenario-2.js';
import { MAP as SCENARIO_3 } from './scenario-3.js';
import { MAP as SCENARIO_4 } from './scenario-4.js';
import { MAP as SCENARIO_5 } from './scenario-5.js';
import { MAP as SCENARIO_6 } from './scenario-6.js';
import { MAP as SCENARIO_7 } from './scenario-7.js';
import { MAP as SCENARIO_8 } from './scenario-8.js';
import { MAP as SCENARIO_9 } from './scenario-9.js';
import { MAP as SCENARIO_10 } from './scenario-10.js';
import { MAP as SCENARIO_11 } from './scenario-11.js';
import { MAP as SCENARIO_12 } from './scenario-12.js';
import { MAP as SCENARIO_13 } from './scenario-13.js';
import { MAP as SCENARIO_14 } from './scenario-14.js';
import { MAP as SCENARIO_15 } from './scenario-15.js';
import { MAP as SCENARIO_16 } from './scenario-16.js';
import { MAP as SCENARIO_17 } from './scenario-17.js';
import { MAP as SCENARIO_18 } from './scenario-18.js';
import { MAP as SCENARIO_19 } from './scenario-19.js';
import { MAP as SCENARIO_20 } from './scenario-20.js';
import { MAP as SCENARIO_21 } from './scenario-21.js';
import { MAP as SCENARIO_22 } from './scenario-22.js';
import { MAP as SCENARIO_23 } from './scenario-23.js';
import { MAP as SCENARIO_24 } from './scenario-24.js';
import { MAP as SCENARIO_25 } from './scenario-25.js';

export const SCENARIOS = [
  SCENARIO_1, SCENARIO_2, SCENARIO_3, SCENARIO_4, SCENARIO_5,
  SCENARIO_6, SCENARIO_7, SCENARIO_8, SCENARIO_9, SCENARIO_10,
  SCENARIO_11, SCENARIO_12, SCENARIO_13, SCENARIO_14, SCENARIO_15,
  SCENARIO_16, SCENARIO_17, SCENARIO_18, SCENARIO_19, SCENARIO_20,
  SCENARIO_21, SCENARIO_22, SCENARIO_23, SCENARIO_24, SCENARIO_25,
  TEST_SCENE,
];

export function getScenarioById(id) {
  return SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
}
