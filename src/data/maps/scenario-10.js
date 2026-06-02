// scenario-10.js — "Holy Trinity". 3-faction multi-front intro.
// Player at bottom, AI top-left, Yellow top-right. A central mountain partitions
// the upper half so the two AIs can't easily attack each other directly — they
// both press the player. The player must split attention or pick which side to
// strike first.

export const MAP = {
  id: 'scenario-10',
  name: 'Holy Trinity',
  description: 'Three sides, three fronts. Pick your fight.',
  width: 540,
  height: 960,
  nodes: [
    { id: 'P',  x: 270, y: 860, owner: 'player', rank: 'light'  },
    { id: 'n1', x: 270, y: 620, owner: null,     rank: 'medium' },
    { id: 'n2', x: 100, y: 450, owner: null,     rank: 'light'  },
    { id: 'n3', x: 440, y: 450, owner: null,     rank: 'light'  },
    { id: 'A',  x: 130, y: 150, owner: 'ai',     rank: 'light'  },
    { id: 'Y',  x: 410, y: 150, owner: 'yellow', rank: 'light'  },
  ],
  // Central mountain between A and Y so they don't auto-target each other.
  // Forces all three factions toward the contested midline.
  terrainRegions: [
    { type: 'mountain', poly: [
      [220, 200], [320, 200], [320, 380], [220, 380],
    ]},
  ],
};
