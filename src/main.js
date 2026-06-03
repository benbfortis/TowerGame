// main.js — boot + app state machine.
// v1.21: Play picks a random scenario; in-game Exit / Retry / Next-random.

import { SCENARIOS } from './data/maps/index.js';
import { VERSION_LABEL } from './data/store.js';
import { createState, resetState } from './model/state.js';
import { createAi, resetAi } from './model/ai.js';
import { setupCanvas } from './view/canvas.js';
import { render } from './view/render.js';
import { attachInput } from './controller/input.js';
import { createTick } from './controller/tick.js';
import { attachHud } from './ui/hud.js';
import { attachLoadout } from './ui/loadout.js';
import { startLoop } from './game.js';

function pickRandomScenario() {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

let currentMap = SCENARIOS[0];
const state = createState(currentMap);
const ai = createAi();
const viewState = { drag: null };
const tick = createTick(state, ai);

const versionEl = document.getElementById('hud-version');
if (versionEl) versionEl.textContent = VERSION_LABEL;
setTimeout(() => {
  const el = document.getElementById('hud-version');
  if (!el || !el.textContent || !el.textContent.startsWith('v')) {
    console.warn('[TowerGame] Version badge missing or empty — violation of CLAUDE.md §0');
  }
}, 100);

// onStart receives ('random') or ('selected', map). Default → random.
const loadout = attachLoadout(state, (mode, map) => {
  if (mode === 'selected' && map) startMatchOn(map);
  else playRandom();
}, {
  scenarios: SCENARIOS,
  onScenarioChange: (idx) => { /* preview only — Play Random ignores this */ },
});

function playRandom() {
  currentMap = pickRandomScenario();
  startMatchOn(currentMap);
}

function startMatchOn(map) {
  currentMap = map;
  resetState(state, map);
  resetAi(ai);
  viewState.drag = null;
  state.mode = 'playing';
}

function exitToLoadout() {
  resetAi(ai);
  viewState.drag = null;
  state.winner = null;
  state.mode = 'loadout';
  loadout.show();
}

function retryCurrent() {
  startMatchOn(currentMap);
}

const { canvas, ctx } = setupCanvas('game', currentMap.width, currentMap.height);
attachInput(canvas, state, viewState, currentMap.width, currentMap.height);
const hud = attachHud(state, {
  exitToLoadout,
  retryCurrent,
  nextRandom: playRandom,
  changeLoadout: exitToLoadout,
});

startLoop(
  (dt) => { if (state.mode === 'playing') tick(dt); },
  () => { render(ctx, state, viewState); hud.update(); }
);
