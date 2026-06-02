// scenario-12.js — "Island Heavy". Resource island.
// A heavy neutral sits behind a wide chasm — only heavy units can cross.
// Player and AI both start with a heavy-feeder chain on their side.
// Race to capture the island heavy first; whoever lands it gets a heavy stream.

export const MAP = {
  id: 'scenario-12',
  name: 'Island Heavy',
  description: 'A heavy prize across the chasm. Only heavies cross.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 130, y: 830, owner: 'player', rank: 'medium' },
    { id: 'pH', x: 270, y: 760, owner: 'player', rank: 'heavy'  },
    { id: 'n1', x: 270, y: 480, owner: null,     rank: 'heavy'  }, // island prize
    { id: 'A',  x: 410, y: 130, owner: 'ai',     rank: 'medium' },
    { id: 'aH', x: 270, y: 200, owner: 'ai',     rank: 'heavy'  },
  ],
  // Chasm bands above and below the island. Heavy crosses at 0.5×; others blocked.
  // Sea blob on the left edge as scenery.
  terrainRegions: [
    { type: 'chasm', poly: [
      [0,   380], [540, 380], [540, 440], [0,   440],
    ]},
    { type: 'chasm', poly: [
      [0,   520], [540, 520], [540, 580], [0,   580],
    ]},
    { type: 'sea', poly: [
      [0,   700], [40,  690], [70,  700], [85,  720], [90,  745],
      [80,  770], [55,  785], [25,  785], [0,   775],
    ]},
  ],
};
