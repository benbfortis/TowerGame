// scenario-17.js — "Crooked Roads". Risk/Reward routes.
// Two routes to AI base: SHORT through brick (heavy 1.1×, others slow), LONG
// around grass (faster lights). Player's loadout choice (worker vs demolitionBall)
// determines which route is optimal. AI route is fixed (terrain-aware A*).

export const MAP = {
  id: 'scenario-17',
  name: 'Crooked Roads',
  description: 'Short path through brick or long path through grass.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'medium' },
    { id: 'n1', x: 130, y: 600, owner: null,     rank: 'light'  }, // short-brick gate
    { id: 'n2', x: 130, y: 300, owner: null,     rank: 'light'  },
    { id: 'n3', x: 430, y: 600, owner: null,     rank: 'medium' }, // long-grass gate
    { id: 'n4', x: 430, y: 300, owner: null,     rank: 'light'  },
    { id: 'A',  x: 270, y: 130, owner: 'ai',     rank: 'medium' },
  ],
  // Brick rectangle covers the short left lane between n1 and n2. Heavy 1.1×
  // makes it the fastest path — but lights slow there. Long right lane through
  // n3-n4 is grass (no terrain region) — open and fast for lights.
  terrainRegions: [
    { type: 'brick', poly: [
      [70,  330], [200, 330], [200, 580], [70,  580],
    ]},
    // Mountain slab between the two lanes so they don't share LOS.
    { type: 'mountain', poly: [
      [240, 380], [340, 380], [340, 580], [240, 580],
    ]},
  ],
};
