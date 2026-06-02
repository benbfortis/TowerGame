// scenario-23.js — "Heavy Highway". Resource island + chain.
// Two chasm bands isolate a central island with TWO heavy neutrals. Player and
// AI both have heavy feeders; whoever builds the longer chain to the island
// wins. Long-form puzzle that rewards both rank-economy and routing.

export const MAP = {
  id: 'scenario-23',
  name: 'Heavy Highway',
  description: 'Two heavies on an island. Build the chain.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 130, y: 870, owner: 'player', rank: 'medium' },
    { id: 'pH', x: 410, y: 870, owner: 'player', rank: 'heavy'  },
    { id: 'pn', x: 270, y: 730, owner: null,     rank: 'medium' },
    { id: 'i1', x: 180, y: 480, owner: null,     rank: 'heavy'  }, // island
    { id: 'i2', x: 360, y: 480, owner: null,     rank: 'heavy'  }, // island
    { id: 'an', x: 270, y: 230, owner: null,     rank: 'medium' },
    { id: 'aH', x: 130, y: 90,  owner: 'ai',     rank: 'heavy'  },
    { id: 'A',  x: 410, y: 90,  owner: 'ai',     rank: 'medium' },
  ],
  // Two chasm bands frame the island — heavy crosses at 0.5×, others blocked.
  // Sea blob in the corner for scenery (off the winning path).
  terrainRegions: [
    { type: 'chasm', poly: [
      [0,   380], [540, 380], [540, 420], [0,   420],
    ]},
    { type: 'chasm', poly: [
      [0,   540], [540, 540], [540, 580], [0,   580],
    ]},
    { type: 'sea', poly: [
      [490, 770], [515, 760], [535, 775], [540, 800], [535, 830],
      [515, 850], [490, 855], [465, 845], [455, 820], [460, 790],
    ]},
  ],
};
