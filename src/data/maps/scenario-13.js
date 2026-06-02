// scenario-13.js — "Forced Hold". Forced defense.
// AI starts very close to P with TWO mediums. Player's first move MUST be to
// route an inflow into P (from the back neutral n0) for pop seed — attacking
// first means losing the base. A brick wall partitions the upper map so the AI
// can only press through one corridor.

export const MAP = {
  id: 'scenario-13',
  name: 'Forced Hold',
  description: 'Enemies at the gate. Defend or die.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 750, owner: 'player', rank: 'light'  },
    { id: 'n0', x: 270, y: 890, owner: null,     rank: 'light'  }, // back seed
    { id: 'n1', x: 130, y: 500, owner: null,     rank: 'light'  },
    { id: 'A1', x: 180, y: 280, owner: 'ai',     rank: 'medium' },
    { id: 'A2', x: 380, y: 280, owner: 'ai',     rank: 'medium' },
  ],
  // Brick wall on the right side of the middle band forces the AI press
  // through the n1 corridor on the left. Buys the player room to seed.
  terrainRegions: [
    { type: 'brick', poly: [
      [300, 400], [540, 400], [540, 560], [300, 560],
    ]},
  ],
};
