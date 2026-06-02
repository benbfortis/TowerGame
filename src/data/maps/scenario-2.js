// scenario-2.js — "Two Paths". Pick a flank or push both.
// Four factories: P at bottom, two flanking neutrals, A at top. Teaches
// multi-target invasions — drag P→n1 and P→n2 to push on two fronts at once.

export const MAP = {
  id: 'scenario-2',
  name: 'Two Paths',
  description: 'Pick a flank — or push both at once with two invasions.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light' },
    { id: 'n1', x: 130, y: 500, owner: null,     rank: 'light' },
    { id: 'n2', x: 410, y: 500, owner: null,     rank: 'light' },
    { id: 'A',  x: 270, y: 170, owner: 'ai',     rank: 'light' },
  ],
  terrainRegions: [],
};
