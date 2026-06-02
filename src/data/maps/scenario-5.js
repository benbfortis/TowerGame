// scenario-5.js — "Heavy Required". Combines pathfinding + rank choice + chain.
// A chasm cuts the map in two. ONLY heavy can cross the chasm. You start with
// a light base; to reach A you must first capture the medium and then the heavy
// factory on YOUR side, then push heavy through the chasm. Lights/mediums you
// chain into the heavy feed its pop and let it emit more heavies.

export const MAP = {
  id: 'scenario-5',
  name: 'Heavy Required',
  description: 'Only heavies cross the chasm. Build up to one — then crash through.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 130, y: 830, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 380, y: 830, owner: null,     rank: 'medium' },
    { id: 'n2', x: 250, y: 700, owner: null,     rank: 'heavy'  },
    { id: 'n3', x: 130, y: 230, owner: null,     rank: 'light'  },
    { id: 'n4', x: 380, y: 230, owner: null,     rank: 'light'  },
    { id: 'A',  x: 270, y: 100, owner: 'ai',     rank: 'light'  },
  ],
  // Wide chasm cuts the map horizontally — only heavy can traverse it (per
  // TERRAIN_EFFECTS.chasm: heavy 0.5×, others blocked). Plus an organic sea
  // on the right edge as scenery (doesn't bisect any winning path).
  terrainRegions: [
    { type: 'chasm', poly: [
      [0, 420], [540, 420], [540, 530], [0, 530],
    ]},
    { type: 'sea', poly: [
      [490, 600], [515, 595], [535, 610], [540, 640], [535, 680],
      [515, 705], [485, 710], [460, 695], [450, 660], [460, 625],
    ]},
  ],
};
