// scenario-22.js — "Four Corners". 4-faction multi-front.
// Player bottom-left. AI top-right. Yellow top-left. Green bottom-right.
// Brick walls partition the map into quadrants connected by narrow gates.
// Each faction has natural neighbours to skirmish — the player picks
// alliances of convenience via routing.

export const MAP = {
  id: 'scenario-22',
  name: 'Four Corners',
  description: 'Four factions, four corners. Pick your enemies.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 110, y: 830, owner: 'player', rank: 'medium' },
    { id: 'G',  x: 430, y: 830, owner: 'green',  rank: 'medium' },
    { id: 'Y',  x: 110, y: 170, owner: 'yellow', rank: 'medium' },
    { id: 'A',  x: 430, y: 170, owner: 'ai',     rank: 'medium' },
    { id: 'n1', x: 270, y: 700, owner: null,     rank: 'light'  },
    { id: 'n2', x: 270, y: 480, owner: null,     rank: 'heavy'  }, // contested centre
    { id: 'n3', x: 270, y: 260, owner: null,     rank: 'light'  },
    { id: 'nL', x: 110, y: 500, owner: null,     rank: 'medium' }, // left lane
    { id: 'nR', x: 430, y: 500, owner: null,     rank: 'medium' }, // right lane
  ],
  // Brick cross divides the map: horizontal bar above n1 and below n3, plus
  // a small vertical band beside the centre. Each quadrant connects via the
  // n1/n3 gates and the lane neutrals nL/nR.
  terrainRegions: [
    { type: 'brick', poly: [
      [0,   600], [220, 600], [220, 640], [0,   640],
    ]},
    { type: 'brick', poly: [
      [320, 600], [540, 600], [540, 640], [320, 640],
    ]},
    { type: 'brick', poly: [
      [0,   320], [220, 320], [220, 360], [0,   360],
    ]},
    { type: 'brick', poly: [
      [320, 320], [540, 320], [540, 360], [320, 360],
    ]},
  ],
};
