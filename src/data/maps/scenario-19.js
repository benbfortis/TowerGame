// scenario-19.js — "Roadblock". Heavy roadblock — AI base is fortified.
// AI starts with a heavy at A and a feeder medium nearby. Brute-force light
// rushes bounce off. Player must build a heavy-feeder chain (lights → medium
// → heavy → siege) before assault. A brick wall channels the assault through
// one specific corridor where the player can mass before the push.

export const MAP = {
  id: 'scenario-19',
  name: 'Roadblock',
  description: 'AI fortress. Build heavies or lose.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 870, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 130, y: 690, owner: null,     rank: 'medium' },
    { id: 'n2', x: 410, y: 690, owner: null,     rank: 'light'  },
    { id: 'n3', x: 270, y: 540, owner: null,     rank: 'heavy'  }, // staging heavy
    { id: 'n4', x: 130, y: 350, owner: null,     rank: 'light'  },
    { id: 'aM', x: 410, y: 280, owner: 'ai',     rank: 'medium' },
    { id: 'A',  x: 270, y: 130, owner: 'ai',     rank: 'heavy'  },
  ],
  // Brick L-shape channels assault toward n3 (the staging heavy). Forces the
  // player to commit to capturing n3 before they can push A.
  terrainRegions: [
    { type: 'brick', poly: [
      [0,   430], [80,  430], [80,  640], [0,   640],
    ]},
    { type: 'brick', poly: [
      [460, 430], [540, 430], [540, 640], [460, 640],
    ]},
    // Mountain strip above n3 blocks light LOS from n3 directly to A.
    { type: 'mountain', poly: [
      [110, 200], [350, 200], [350, 260], [110, 260],
    ]},
  ],
};
