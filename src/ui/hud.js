// hud.js — DOM-side HUD. Reads state (read-only); calls callbacks.
// v1.21: multi-faction counts + in-game Exit/Retry controls.
//
// Public surface:
//   attachHud(state, callbacks) — wire DOM nodes; returns { update() }.
//     callbacks.exitToLoadout()      — go back to loadout selector
//     callbacks.retryCurrent()       — restart current scenario, same loadout
//     callbacks.nextRandom()         — pick a fresh random scenario and start
//     callbacks.changeLoadout()      — alias of exit; for the game-over modal

import { UNITS } from '../data/units.js';

const FACTION_COLORS = {
  player: '#3aa6ff',
  ai:     '#ff5b5b',
  yellow: '#ffd166',
  green:  '#8fd99a',
};
const FACTION_LABELS = {
  player: 'You',
  ai:     'Red',
  yellow: 'Yellow',
  green:  'Green',
};

export function attachHud(state, callbacks) {
  const elFactionCounts = document.getElementById('hud-faction-counts');
  const elOver = document.getElementById('hud-over');
  const elOverText = document.getElementById('hud-over-text');
  const elOverRestart = document.getElementById('hud-over-restart');
  const elOverNext = document.getElementById('hud-over-next');
  const elOverRetry = document.getElementById('hud-over-retry');
  const elHint = document.getElementById('hud-hint');
  const elLoadout = document.getElementById('hud-loadout');
  const elRetry = document.getElementById('hud-retry');
  const elExit = document.getElementById('hud-exit');
  const elControls = document.getElementById('hud-controls');

  if (elOverRestart) elOverRestart.addEventListener('click', () => {
    if (elOver) elOver.classList.add('hidden');
    callbacks.changeLoadout?.();
  });
  if (elOverNext) elOverNext.addEventListener('click', () => {
    if (elOver) elOver.classList.add('hidden');
    callbacks.nextRandom?.();
  });
  if (elOverRetry) elOverRetry.addEventListener('click', () => {
    if (elOver) elOver.classList.add('hidden');
    callbacks.retryCurrent?.();
  });
  if (elRetry) elRetry.addEventListener('click', () => callbacks.retryCurrent?.());
  if (elExit) elExit.addEventListener('click', () => callbacks.exitToLoadout?.());

  let prevWinner = null;
  let prevLoadoutKey = '';

  function update() {
    const playing = state.mode === 'playing';
    if (elHint) elHint.style.display = playing && !state.winner ? '' : 'none';
    if (elControls) elControls.style.display = playing ? '' : 'none';

    // Per-faction counts (only show factions that exist on this map).
    if (elFactionCounts) {
      const counts = { player: 0, ai: 0, yellow: 0, green: 0 };
      for (const f of state.factories) {
        if (f.owner && counts[f.owner] !== undefined) counts[f.owner]++;
      }
      const parts = [];
      for (const fac of ['player', 'ai', 'yellow', 'green']) {
        if (counts[fac] > 0 || (state.enemyBaseIds || []).some(id => state.factories.find(f => f.id === id)?.owner === fac) || fac === 'player') {
          if (counts[fac] > 0 || fac === 'player') {
            parts.push(`<span class="faction-count" style="color:${FACTION_COLORS[fac]}"><span class="dot" style="background:${FACTION_COLORS[fac]}"></span>${FACTION_LABELS[fac]}: ${counts[fac]}</span>`);
          }
        }
      }
      elFactionCounts.innerHTML = parts.join('');
    }

    if (elLoadout && state.loadouts) {
      const key = `${state.loadouts.player.light}|${state.loadouts.player.medium}|${state.loadouts.player.heavy}`;
      if (key !== prevLoadoutKey || elLoadout.children.length === 0) {
        prevLoadoutKey = key;
        elLoadout.innerHTML = '';
        for (const rank of ['light', 'medium', 'heavy']) {
          const u = UNITS[state.loadouts.player[rank]];
          if (!u) continue;
          const span = document.createElement('span');
          span.className = 'hud-loadout-pip';
          span.title = `${rank}: ${u.name}`;
          span.textContent = u.glyph;
          span.style.background = u.color;
          elLoadout.appendChild(span);
        }
      }
      elLoadout.style.display = playing ? '' : 'none';
    }

    if (state.winner !== prevWinner) {
      prevWinner = state.winner;
      if (state.winner) {
        if (elOver) elOver.classList.remove('hidden');
        if (elOverText) elOverText.textContent = state.winner === 'player' ? 'You Win' : 'You Lose';
      } else {
        if (elOver) elOver.classList.add('hidden');
      }
    }
  }

  return { update };
}
