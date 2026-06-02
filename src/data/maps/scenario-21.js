// scenario-21.js — "Race the Clock". Race-the-clock tight timing.
// Small map. Player must capture AI base within ~75s or AI's heavy chain
// (an aH adjacent to A) wins the macro game. Efficient routing required.
// A mountain forces a specific approach path.

export const MAP = {
  id: 'scenario-21',
  name: 'Race the Clock',
  description: 'Win fast or the heavies win for them.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 140, y: 620, owner: null,     rank: 'light'  },
    { id: 'n2', x: 400, y: 620, owner: null,     rank: 'medium' },
    { id: 'aH', x: 270, y: 280, owner: 'ai',     rank: 'heavy'  }, // AI's heavy chain
    { id: 'A',  x: 270, y: 130, owner: 'ai',     rank: 'medium' },
  ],
  // Mountain band across the middle forces the approach to A through the
  // narrow flanks. Direct rush from n2 is blocked; must commit to a side.
  terrainRegions: [
    { type: 'mountain', poly: [
      [110, 400], [430, 400], [430, 480], [110, 480],
    ]},
  ],
};
