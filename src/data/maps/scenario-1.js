// scenario-1.js — "First Capture". The simplest puzzle: one neutral, one path.
// Three factories in a column. Drag P→n1 to capture; then n1→A to win.
// Teaches: the drag-to-invade gesture and how capture works.

export const MAP = {
  id: 'scenario-1',
  name: 'First Capture',
  description: 'Drag from your factory. Capture the neutral. Then capture the enemy.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light' },
    { id: 'n1', x: 270, y: 500, owner: null,     rank: 'light' },
    { id: 'A',  x: 270, y: 170, owner: 'ai',     rank: 'light' },
  ],
  terrainRegions: [],
};
