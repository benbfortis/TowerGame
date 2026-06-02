// units.js — unit catalog.
// v1.13: every unit has explicit attack + hp. Default units per rank (worker /
// bulldozer / demolitionBall) have attack == hp, so two identical defaults that
// collide mutually-kill in one simultaneous damage exchange (combat.js trade).
// Non-default variants can have asymmetric stats (glass cannons, tanks, etc.).
//
// Optional attributes:
//   pathfinds: true  — unit uses A* to route around blockers (default false →
//                      straight line; rank blockers stop it cold).
//   range: number, fireCooldownSec: number — unit fires at enemy units in
//                      range while in flight (v1.12 ranged mechanic).

export const UNITS = {
  // ── Light ────────────────────────────────────────────────────────────
  worker:        { id: 'worker',        rank: 'light',  name: 'Worker',
                   glyph: 'w', tagline: 'Quick courier. Fragile. Straight-line only.',
                   color: '#7ec8ff',
                   attack: 1, hp: 1 },
  scout:         { id: 'scout',         rank: 'light',  name: 'Scout',
                   glyph: 's', tagline: 'Light recon — routes around obstacles.',
                   color: '#9bd6ff',
                   attack: 1, hp: 1,
                   pathfinds: true },
  sharpshooter:  { id: 'sharpshooter',  rank: 'light',  name: 'Sharpshooter',
                   glyph: 'X', tagline: 'Light ranged. 0 capture damage. Pure escort.',
                   color: '#a8e1ff',
                   attack: 1, hp: 1,
                   range: 70, fireCooldownSec: 0.8,
                   factoryDamage: 0 },

  // ── Medium ───────────────────────────────────────────────────────────
  bulldozer:     { id: 'bulldozer',     rank: 'medium', name: 'Bulldozer',
                   glyph: 'B', tagline: 'Tracked. Chews through walls.',
                   color: '#ffd166',
                   attack: 3, hp: 3 },
  sapper:        { id: 'sapper',        rank: 'medium', name: 'Sapper',
                   glyph: 'S', tagline: 'Engineer crew. Steady.',
                   color: '#ffb84d',
                   attack: 3, hp: 3 },
  mortar:        { id: 'mortar',        rank: 'medium', name: 'Mortar',
                   glyph: 'M', tagline: 'Medium ranged. 1 capture damage. Glass cannon.',
                   color: '#ffc966',
                   attack: 3, hp: 1,
                   range: 110, fireCooldownSec: 1.2,
                   factoryDamage: 1 },

  // ── Heavy ────────────────────────────────────────────────────────────
  demolitionBall:{ id: 'demolitionBall',rank: 'heavy',  name: 'Demolition Ball',
                   glyph: 'D', tagline: 'Wrecking-ball. 8 damage, 8 HP.',
                   color: '#ff8a8a',
                   attack: 8, hp: 8 },
  siegeTank:     { id: 'siegeTank',     rank: 'heavy',  name: 'Siege Tank',
                   glyph: 'T', tagline: 'Slow, extra-tough. Soaks more hits.',
                   color: '#ff6d6d',
                   attack: 8, hp: 12 },
  artillery:     { id: 'artillery',     rank: 'heavy',  name: 'Artillery',
                   glyph: 'A', tagline: 'Heavy ranged. 3 capture damage. Long shots.',
                   color: '#ff7d7d',
                   attack: 8, hp: 3,
                   range: 170, fireCooldownSec: 2.0,
                   factoryDamage: 3 },
};

export function listUnitsByRank(rank) {
  return Object.values(UNITS).filter(u => u.rank === rank);
}

export function getUnit(id) {
  return UNITS[id] || null;
}
