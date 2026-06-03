// loadout.js — pre-combat unit + scenario selection UI.
// DOM-side. Mutates state.loadouts.player on slot cycle. On scenario cycle,
// fires the onScenarioChange callback so main.js can swap currentMap.
//
// Public surface:
//   attachLoadout(state, onStart, opts) — wires the loadout screen DOM.
//     opts.scenarios: SCENARIOS[] (from data/maps/index.js)
//     opts.onScenarioChange(idx): called when player cycles scenario.
//   returns { show, hide }.

import { listUnitsByRank, RANKS } from '../data/store.js';

export function attachLoadout(state, onStart, opts = {}) {
  const screen = document.getElementById('loadout-screen');
  if (!screen) return { show() {}, hide() {} };

  // ── Scenario row (v1.10) ───────────────────────────────────────────────
  const scenarios = opts.scenarios || [];
  const onScenarioChange = opts.onScenarioChange || (() => {});
  let scenarioIdx = 0;
  const scenarioRow = screen.querySelector('.scenario-row');
  if (scenarioRow && scenarios.length > 0) {
    const nameEl = scenarioRow.querySelector('.scenario-name');
    const descEl = scenarioRow.querySelector('.scenario-desc');
    const prevBtn = scenarioRow.querySelector('.scenario-prev');
    const nextBtn = scenarioRow.querySelector('.scenario-next');
    function renderScenario() {
      const s = scenarios[scenarioIdx];
      if (nameEl) nameEl.textContent = s.name || s.id || `Scenario ${scenarioIdx + 1}`;
      if (descEl) descEl.textContent = s.description || '';
      onScenarioChange(scenarioIdx);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => {
      scenarioIdx = (scenarioIdx - 1 + scenarios.length) % scenarios.length;
      renderScenario();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      scenarioIdx = (scenarioIdx + 1) % scenarios.length;
      renderScenario();
    });
    renderScenario();
  }

  // ── Unit slots ─────────────────────────────────────────────────────────
  for (const rank of RANKS) {
    const row = screen.querySelector(`.loadout-row[data-rank="${rank}"]`);
    if (!row) continue;
    const nameEl = row.querySelector('.loadout-unit-name');
    const descEl = row.querySelector('.loadout-unit-desc');
    const glyphEl = row.querySelector('.loadout-unit-glyph');
    const prevBtn = row.querySelector('.loadout-prev');
    const nextBtn = row.querySelector('.loadout-next');

    const units = listUnitsByRank(rank);
    if (units.length === 0) continue;
    let idx = Math.max(0, units.findIndex(u => u.id === state.loadouts.player[rank]));

    function render() {
      const u = units[idx];
      if (nameEl)  nameEl.textContent = u.name;
      if (descEl)  descEl.textContent = u.tagline;
      if (glyphEl) {
        glyphEl.textContent = u.glyph;
        glyphEl.style.background = u.color;
      }
      state.loadouts.player[rank] = u.id;
    }
    if (prevBtn) prevBtn.addEventListener('click', () => {
      idx = (idx - 1 + units.length) % units.length;
      render();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      idx = (idx + 1) % units.length;
      render();
    });
    render();
  }

  const startBtn = document.getElementById('loadout-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      screen.classList.add('hidden');
      onStart('random');
    });
  }
  const startSelectedBtn = document.getElementById('loadout-start-selected');
  if (startSelectedBtn) {
    startSelectedBtn.addEventListener('click', () => {
      screen.classList.add('hidden');
      onStart('selected', scenarios[scenarioIdx]);
    });
  }

  return {
    show() { screen.classList.remove('hidden'); },
    hide() { screen.classList.add('hidden'); },
  };
}
