// scenario-11.js — "Tempo Trap". A bait factory the player WILL want to grab.
// A juicy medium sits close to P. Capturing it costs ~3 pop (and the trip
// commits enough that the AI can punish via the open right flank if the
// player doesn't also defend the bait neutral n3 on the way to A.)

export const MAP = {
  id: 'scenario-11',
  name: 'Tempo Trap',
  description: 'A juicy medium sits close. Greed has a price.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 830, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 270, y: 680, owner: null,     rank: 'medium' }, // the bait
    { id: 'n2', x: 130, y: 460, owner: null,     rank: 'light'  },
    { id: 'n3', x: 420, y: 380, owner: null,     rank: 'light'  },
    { id: 'A',  x: 270, y: 150, owner: 'ai',     rank: 'medium' },
  ],
  // Brick wall on the left flank pushes lights to route via the right side
  // (heavy 1.1× still works but no heavies present). Channels both sides.
  terrainRegions: [
    { type: 'brick', poly: [
      [0,   520], [80,  520], [80,  720], [0,   720],
    ]},
  ],
};
