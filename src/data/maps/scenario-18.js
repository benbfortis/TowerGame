// scenario-18.js — "Friendly Anchor". Two non-adjacent player factories.
// Player starts with P (front, light) and pB (back, heavy). The back heavy
// generates slowly; player must route lights from front into back to feed pop
// while pushing the front to attack. Forces multi-target invasion early.

export const MAP = {
  id: 'scenario-18',
  name: 'Friendly Anchor',
  description: 'Feed your back base. Push from the front.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 600, owner: 'player', rank: 'light'  }, // front
    { id: 'pB', x: 270, y: 870, owner: 'player', rank: 'heavy'  }, // back anchor
    { id: 'n1', x: 130, y: 430, owner: null,     rank: 'light'  },
    { id: 'n2', x: 410, y: 430, owner: null,     rank: 'medium' },
    { id: 'A',  x: 270, y: 150, owner: 'ai',     rank: 'medium' },
  ],
  // Mountain wedge above the player front blocks the AI from directly
  // pressing pB — AI has to take down P first. Buys time to grow the heavy.
  terrainRegions: [
    { type: 'mountain', poly: [
      [200, 280], [340, 280], [340, 380], [200, 380],
    ]},
  ],
};
