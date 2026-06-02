// scenario-25.js — "Last Stand". Hardest. 4-faction siege.
// Player at bottom, surrounded by AI (top), Yellow (left), Green (right).
// Heavy neutrals scattered. Brick walls partition the map so each AI faction
// has a primary corridor — but the player's only winning route involves
// kingmaking: weaken one AI enough that another finishes it for you.

export const MAP = {
  id: 'scenario-25',
  name: 'Last Stand',
  description: 'Three foes, one player. Make them fight.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 870, owner: 'player', rank: 'medium' },
    { id: 'pH', x: 270, y: 740, owner: 'player', rank: 'heavy'  },
    { id: 'n1', x: 100, y: 700, owner: null,     rank: 'light'  },
    { id: 'n2', x: 440, y: 700, owner: null,     rank: 'light'  },
    { id: 'n3', x: 270, y: 500, owner: null,     rank: 'heavy'  }, // contested heavy
    { id: 'n4', x: 100, y: 320, owner: null,     rank: 'medium' },
    { id: 'n5', x: 440, y: 320, owner: null,     rank: 'medium' },
    { id: 'Y',  x: 80,  y: 130, owner: 'yellow', rank: 'medium' },
    { id: 'A',  x: 270, y: 90,  owner: 'ai',     rank: 'heavy'  },
    { id: 'G',  x: 460, y: 130, owner: 'green',  rank: 'medium' },
  ],
  // Brick walls partition the upper map into 3 sectors (Y / A / G corridors).
  // Mountain band across the middle keeps the player from rushing top-down.
  // Each AI has to come through the middle corridor (n3) which is the focal
  // contested fight — whoever the player pressures most diverts inward.
  terrainRegions: [
    { type: 'brick', poly: [
      [160, 180], [220, 180], [220, 280], [160, 280],
    ]},
    { type: 'brick', poly: [
      [320, 180], [380, 180], [380, 280], [320, 280],
    ]},
    { type: 'mountain', poly: [
      [0,   400], [180, 400], [180, 440], [0,   440],
    ]},
    { type: 'mountain', poly: [
      [360, 400], [540, 400], [540, 440], [360, 440],
    ]},
  ],
};
