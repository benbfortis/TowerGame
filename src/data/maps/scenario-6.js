// scenario-6.js — "Choke Tunnel". Classic chokepoint.
// Two brick walls form a narrow vertical corridor through a single neutral.
// Both sides must funnel through n1; whoever holds the choke wins.

export const MAP = {
  id: 'scenario-6',
  name: 'Choke Tunnel',
  description: 'One corridor between you and the foe. Hold the choke.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 270, y: 500, owner: null,     rank: 'medium' },
    { id: 'A',  x: 270, y: 170, owner: 'ai',     rank: 'light'  },
  ],
  // Two brick walls on either side of the centre — they block any flanking
  // LOS line between P and A. The only LOS to A from P passes through n1.
  terrainRegions: [
    { type: 'brick', poly: [
      [0,   400], [200, 400], [200, 600], [0,   600],
    ]},
    { type: 'brick', poly: [
      [340, 400], [540, 400], [540, 600], [340, 600],
    ]},
  ],
};
