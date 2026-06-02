// scenario-3.js — "Around the Mountain". Pathfinding mechanic — lights detour.
// A mountain blocks the direct P→A line. Light units can't cross it, but A*
// routes them around. Player learns that lights take detours automatically.

export const MAP = {
  id: 'scenario-3',
  name: 'Around the Mountain',
  description: 'A mountain blocks the way. Your lights find another route.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light' },
    { id: 'n1', x: 100, y: 500, owner: null,     rank: 'light' },
    { id: 'n2', x: 440, y: 500, owner: null,     rank: 'light' },
    { id: 'A',  x: 270, y: 170, owner: 'ai',     rank: 'light' },
  ],
  // A central mountain blocks light from going straight. A* routes around it
  // via either flank — your lights pick the shorter side automatically.
  terrainRegions: [
    { type: 'mountain', poly: [
      [200, 380], [340, 380], [340, 620], [200, 620],
    ]},
  ],
};
